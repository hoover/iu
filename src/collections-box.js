import React from 'react'

class Checkbox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      checked: props.default
    }
  }

  handleChange(e) {
    this.setState({
      checked: e.target.checked
    })
    this.props.onChange(this.props.name, e.target.checked)
  }

  render() {
    var id = "checkbox-" + this.props.name
    return (
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            id={id}
            checked={this.state.checked}
            onChange={this.handleChange.bind(this)}></input>
          {' '}
          {this.props.title}
        </label>
      </div>
    )
  }
}

class CollectionsBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selected: props.selected,
    }
  }

  componentWillReceiveProps(props) {
    this.setState({
      selected: props.selected,
    })
  }

  handleChange(name, checked) {
    var all = this.props.collections.map((c) => c.name)
    var selected = this.state.selected.splice(0)
    if (checked) {
      selected.push(name)
    } else {
      selected = selected.filter((c) => c != name)
    }

    this.setState({selected})
    this.props.onChanged(selected)
  }

  render() {
    var result = null
    if (this.props.collections) {
      if (this.props.collections.length) {
        result = this.props.collections.map((col) =>
          <Checkbox
            name={col.name}
            title={col.title}
            key={col.name}
            default={true}
            onChange={this.handleChange.bind(this)}/>
        )
      } else {
        result = <em>none available</em>
      }
    } else {
      result = <em>loading collections ...</em>
    }

    return <div id="collections-box" className="col-sm-2">{result}</div>
  }
}

export default CollectionsBox
