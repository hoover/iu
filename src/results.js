import url from 'url'
import React from 'react'
import Charts from './charts.js'

const nlp = require('nlp_compromise');
var _ = require('underscore');

function timeMs() {
  return new Date().getTime()
}

class Preview extends React.Component {

  render() {
    let embedUrl = `${this.props.url}?embed=on`
    let loaded = (this.state || {}).loaded

    let iframeStyle = (!loaded && {display: 'none'}) || {}
    let loadingStyle = (loaded && {display: 'none'}) || {}

    return (
      <div key={this.props.url}>
        <iframe className='results-item-preview'
                onLoad={() => { this.setState({loaded: true}) }}
                src={embedUrl} style={iframeStyle} />
        <div className="iframe-loading" style={loadingStyle}>
          <i className="fa fa-spinner loading-animate" aria-hidden="true"></i>
          <p><small>Loading</small></p>
        </div>
      </div>
    )
  }
}

class ResultItem extends React.Component {

  viewUrl(item) {
    return 'doc/' + item._collection + '/' + item._id
  }

  _getEntities(text) {
    text = text.substring(0,3000);
    // if (!text) return;
    // // keep only 1000 characters from the text
    // text = text.split('').splice(0, 3000).join('');
    var entities = [];
    var processedText = nlp.text(text);
    var peopleEntities = processedText.people();
    var orgEntities = processedText.organizations();


    // TODO : rewrite with _.map
    for (var i = 0 ; i < peopleEntities.length ; i++) {
      var person = peopleEntities[i];
      var name = '';

      // TODO : rewrite with _.map and join(' ');
      if (person.firstName || person.lastName) {
        if (person.firstName) name += person.firstName + ' ';
        if (person.lastName) name += person.lastName;
        entities.push({name: name, type: 'people'});
      }

    }

    for (var i = 0 ; i < orgEntities.length ; i++) {
      var org = orgEntities[i];
      entities.push({name: this._cleanName(org.text), type: 'org'});
    }

    return _.uniq(entities, function(t) { return t.name });

  }

  _cleanName(str) {
    return str.replace(/[.\d,]/,'');
  }

  render() {
    let {hit} = this.props
    var url = this.viewUrl(hit)

    var attachIcon = null
    if (hit.fields.hasOwnProperty('attachments') && hit.fields.attachments[0]) {
      attachIcon = <i className="fa fa-paperclip" aria-hidden="true"></i>
    }

    var title = hit.fields.filename
    var text = null
    if (hit.highlight) {
      if (hit.highlight.text) {
        text = hit.highlight.text.map((hi, n) =>
          <li key={`${hit._url}${n}`}>
            <span dangerouslySetInnerHTML={{__html: hi}}/>
          </li>
        )
      }
    }

    var word_count = null;
    if (hit.fields["word-count"] && hit.fields["word-count"].length == 1) {
      word_count = hit.fields["word-count"][0] + " words";
    }
    // Named Entities Recognition with NLP
    // var entitiesText = null;
    // if (hit.fields.text && hit.fields.text.length > 0) {
    //   entitiesText = hit.fields.text.map((txt, n) =>
    //     var entities = this._getEntities(txt)
    //     <span >
    //   )
    // }
    var entitiesText = [];
    if (hit.fields.text && hit.fields.text.length > 0) {
      //var entities = this._getEntities("The Nasa Inc. told Bob Marley it was okay");
      var entities = this._getEntities(hit.fields.text[0]);
      for (var i = 0; i<entities.length; i++) {
        var entity = entities[i];
        //entitiesText.push("<span class='results-item-" + entity.type + "'>" + entity.name + "</span>");
        entitiesText.push(entity.name);
      }
    }

    return (
      <li className="results-item" key={hit._url}
        onMouseDown={() => {
          this.willFocus = ! (this.tUp && timeMs() - this.tUp < 300)
        }}
        onMouseMove={() => {
          this.willFocus = false
        }}
        onMouseUp={() => {
          if(this.willFocus) {
            this.tUp = timeMs()
            this.props.onPreview(url)
          }
        }}
        >
        <h3>
          <a href={url} target="_blank"
            onClick={(e) => {
              let modifier = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
              if(! modifier) {
                e.preventDefault()
                this.props.onPreview(url)
              }
            }}
            >{attachIcon} {title}</a>
        </h3>
        <p className='results-item-path'>{hit.fields.path}</p>
        <p className='results-item-word-count'>{word_count}</p>
        <p className='results-item-entities'>{entitiesText.join(', ')}</p>
        <ul className="results-highlight">
          { text }
        </ul>
      </li>
    )
  }

}

/**
 * Props:
 *
 * collections
 * prev_url
 * next_url
 * counts
 * page
 * page_count
 * total
 * hits
 * pagesize
 */
class Results extends React.Component {

  collectionTitle(name) {
    var col = this.props.collections.find(function (c) {
      return c.name == name
    })
    if (col) {
      return col.title
    }
    return name
  }

  renderPageController() {
    var prevUrl = null
    if (this.props.prev_url) {
      prevUrl = <a className="btn btn-secondary-outline btn-sm" href={this.props.prev_url}>&laquo;</a>
    }

    var nextUrl = null
    if (this.props.next_url) {
      nextUrl = <a className="btn btn-secondary-outline btn-sm" href={this.props.next_url}>&raquo;</a>
    }

    var countByIndex = null
    if (this.props.collections && this.props.counts) {
      var indexCounts = this.props.collections.map((col) => {
          if (this.props.counts.hasOwnProperty(col)) {
            return (
              <span key={col}>
                <b>{this.collectionTitle(col)}</b>{' '}
                {this.props.counts[col]}
                <span className="comma">, </span>
              </span>
            )
          } else {
            return null
          }
        }
      )

      countByIndex = (
        <span className="count_by_index">
          ({indexCounts}){' '}
          (page {this.props.page}/{this.props.page_count})
        </span>
      )
    }

    return (
      <p>
        {prevUrl}{' '}
        {this.props.total} hits{' '}
        {countByIndex}{' '}
        {nextUrl}
      </p>
    )
  }

  render() {
    var resultList = this.props.hits.map((hit) =>
      <ResultItem
        key={hit._url}
        hit={hit}
        onPreview={(url) => {
          this.setState({preview: url})
        }}
        />
    )

    var results = null
    if (this.props.hits.length > 0) {
      var start = 1 + (this.props.page - 1) * this.props.pagesize
      results = <ol id="results" start={start}> {resultList} </ol>
    } else {
      results = <p>-- no results --=</p>
    }
    let preview = (this.state || {}).preview
    let previewUrl = preview && url.resolve(window.location.href, preview)

    return (
      <div>
        <Charts {... this.props} />
        <div className='row'>
          <div className='col-sm-4'>
            { this.renderPageController() }
            { results }
            { this.renderPageController() }
          </div>
          {preview &&
            <div className='col-sm-8' key={previewUrl}>
              <Preview url={previewUrl} />
            </div>
          }
        </div>
      </div>
    )
  }

}

export default Results
