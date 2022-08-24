import {
  React,
  utils,
  AllWidgetProps
} from 'jimu-core'

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>, { extent: string, dataSourceId: string }> {
  state = { extent: null, dataSourceId: null }

  componentDidUpdate (prevProps: AllWidgetProps<unknown>) {
    console.log('inside componentDidUpdate...')
    if (utils.getValue(this.props, 'stateProps.extent') !== utils.getValue(prevProps, 'stateProps.extent')) {
      const extent = utils.getValue(this.props, 'stateProps.extent')
      console.log(extent)
      this.setState({ extent: extent })
    }

    if (utils.getValue(this.props, 'stateProps.dataSourceId') !== utils.getValue(prevProps, 'stateProps.dataSourceId')) {
      const dataSourceId = utils.getValue(this.props, 'stateProps.dataSourceId')
      console.log(dataSourceId)
      this.setState({ dataSourceId: dataSourceId })
    }
  }

  componentDidMount () {
    console.log('inside componentDidMount with ', this.props.stateProps?.extent)
  }

  render () {
    console.log('rendering...')
    return <div className="widget-subscribe" style={{ overflow: 'auto', maxHeight: '700px' }}>
        {this.state.extent}
        {this.state.dataSourceId}
    </div>
  }
}
