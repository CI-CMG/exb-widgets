/** @jsx jsx */
import {
  React, jsx, DataSourceComponent, IMUseDataSource, DataSource
} from 'jimu-core'

interface Props {
  useDataSource: IMUseDataSource
  onCreateDataSourceCreatedOrFailed: (dataSourceId: string, dataSource: DataSource) => void
}
export default class FilterItemDataSource extends React.PureComponent<Props> {
  constructor (props) {
    super(props)
  }

  componentWillUnmount () {
  }

  onDataSourceCreated = (ds: DataSource) => {
    this.props.onCreateDataSourceCreatedOrFailed(this.props.useDataSource.dataSourceId, ds)
  }

  onCreateDataSourceFailed = (err) => {
    this.props.onCreateDataSourceCreatedOrFailed(this.props.useDataSource.dataSourceId, null)
  }

  render () {
    return (
      <DataSourceComponent
        useDataSource={this.props.useDataSource}
        onDataSourceCreated={this.onDataSourceCreated}
        onCreateDataSourceFailed={this.onCreateDataSourceFailed}
      />
    )
  }
}
