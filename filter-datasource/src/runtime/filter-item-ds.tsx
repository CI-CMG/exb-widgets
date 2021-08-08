/** @jsx jsx */
import {
  React, jsx, DataSourceComponent, IMUseDataSource, DataSource, DataSourceStatus
} from 'jimu-core'

interface DataSourceProps {
  useDataSource: IMUseDataSource
  onIsDataSourceNotReady: (dataSourceId: string, dataSourceStatus: DataSourceStatus) => void
  onCreateDataSourceCreatedOrFailed: (dataSourceId: string, dataSource: DataSource) => void
}


export default class FilterItemDataSource extends React.PureComponent<DataSourceProps, {}> {
  constructor (props) {
    super(props)
  }

  componentWillUnmount () {
    this.props.onCreateDataSourceCreatedOrFailed(this.props.useDataSource.dataSourceId, null)
    this.props.onIsDataSourceNotReady(this.props.useDataSource.dataSourceId, DataSourceStatus.NotReady)
  }


  onDataSourceCreated = (ds) => {
    this.props.onCreateDataSourceCreatedOrFailed(this.props.useDataSource.dataSourceId, ds)
  }

  onDataSourceInfoChange = (info) => {
    this.props.onIsDataSourceNotReady(this.props.useDataSource.dataSourceId, info?.status)
  }

  onCreateDataSourceFailed = (error) => {
    this.props.onCreateDataSourceCreatedOrFailed(this.props.useDataSource.dataSourceId, null)
  }

  render () {
    const { useDataSource } = this.props
    return (
      <DataSourceComponent
        useDataSource={useDataSource}
        onDataSourceCreated={(ds) => { this.onDataSourceCreated(ds) }}
        onCreateDataSourceFailed={(error) => { this.onCreateDataSourceFailed(error) }}
        onDataSourceInfoChange={this.onDataSourceInfoChange}
      />
    )
  }
}
