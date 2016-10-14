import React from 'react'
import Results from './results.js'
import { SORT_RELEVANCE, SORT_OLDEST, SORT_NEWEST } from './searchpage.js'

class Search extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      searching: false,
      error: null,
      results: null,
      query: null
    }
  }

  buildQuery(q) {
    return {
      query_string: {
        query: q,
        default_operator: 'AND',
      },
    }
  }

  buildSortQuery(order) {
    var sort = ['_score']
    switch (order) {
      case SORT_NEWEST:
        sort = [{"date": {"order": "desc"}}, ... sort]
        break
      case SORT_OLDEST:
        sort = [{"date": {"order": "asc"}}, ... sort]
        break
    }
    return sort
  }

  search(query, success, error) {
    $.ajax({
      url: '/search',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        from: (query.page - 1) * query.size,
        size: query.size,
        query: this.buildQuery(query.q),
        sort: this.buildSortQuery(query.order),
        aggs: {
          count_by_filetype: {terms: {field: 'filetype'}},
        },
        collections: query.collections,
        fields: ['path', 'url', 'mime_type', 'attachments', 'filename', 'word-count'],
        highlight: {
          fields: {
            '*': {
              fragment_size: 150,
              number_of_fragments: 3,
              require_field_match: false,
            }
          }
        },
      }),
      success: success,
      error: error,
    })
  }

  onResults(resp) {
    this.setState({
      searching: false
    })

    var url = function (p) {
      var u = "?q=" + encodeURIComponent(this.state.query.q)
      if (p > 1) u += "&p=" + p
      if (this.state.query.size > 10) {
        u += "&size=" + encodeURIComponent(this.state.query.size)
      }
      if (this.state.query.order != SORT_RELEVANCE) {
        u += "&order=" + encodeURIComponent(this.state.query.order)
      }
      if (this.props.collections) {
        u += "&collections=" + this.props.collections.map(encodeURIComponent).join('+');
      }
      return u
    }.bind(this)

    var page_count = Math.ceil(resp.hits.total / this.state.query.size)
    var page = this.state.query.page
    var prev_url = page > 1 ? url(page - 1) : null
    var next_url = page < page_count ? url(page + 1) : null

    var results = {
      resp: resp,
      hits: resp.hits.hits,
      total: resp.hits.total,
      counts: resp.count_by_index,
      page: page,
      page_count: page_count,
      prev_url: prev_url,
      next_url: next_url,
    }

    this.setState({
      results: results,
      error: null
    })
  }

  onError(err) {
    console.error(err.responseText)
    this.setState({
      searching: false,
      results: null,
      error: "Server error while searching"
    })
  }

  performSearch(query) {
    if(!query) {
      return
    }
    if (this.state.query === query) {
      return
    }

    this.setState({
      searching: true,
      query: query
    })

    this.search(
      query,
      this.onResults.bind(this),
      this.onError.bind(this))
  }

  componentDidMount() {
    this.performSearch(this.props.query)
  }

  componentWillReceiveProps(props) {
    this.performSearch(props.query)
  }

  render() {
    var rv = null
    var results = this.state.results
    if (results) {
      rv = <Results
        resp={results.resp}
        hits={results.hits}
        total={results.total}
        counts={results.counts}
        page={results.page}
        pagesize={this.state.query.size}
        page_count={results.page_count}
        prev_url={results.prev_url}
        next_url={results.next_url}
        collections={this.props.collections}
        onSelect={this.props.onSelect}
      ></Results>
    }
    return (
      <div className="col-sm-10">
        {rv}
        {this.state.searching ? <p>searching ...</p> : null }
        {this.state.error ? <p className="alert alert-danger">{ this.state.error }</p> : null }
      </div>
    )
  }
}

export default Search
