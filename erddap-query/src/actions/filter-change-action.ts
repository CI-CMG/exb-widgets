import {
  AbstractMessageAction,
  MessageType,
  Message,
  getAppStore,
  appActions,
  DataSourceFilterChangeMessage,
  DataSourceManager,
  QueriableDataSource,
  SqlQueryParams,
  MessageDescription
} from 'jimu-core'

export default class FilterAction extends AbstractMessageAction {
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    // console.log('inside filterMessageDescription: ', messageDescription)
    return messageDescription.messageType === 'DATA_SOURCE_FILTER_CHANGE'
  }

  // replaced by filterMessageDescription in v1.9
  // filterMessageType (messageType: MessageType, messageWidgetId?: string): boolean {
  //   return [MessageType.DataSourceFilterChange].includes(messageType)
  // }

  filterMessage (message: Message): boolean {
    // console.log('inside filterMessage: ', message)
    return true
  }

  //set action setting uri
  getSettingComponentUri (messageType: MessageType, messageWidgetId?: string): string {
    return 'actions/filter-change-action-setting'
  }

  onExecute (message: Message, actionConfig?: any): Promise<boolean> | boolean {
    // let q = `${actionConfig.fieldName} = '${message}'`
    let queryString = '1=1'
    // TODO where is actionConfig set?
    // console.log('actionConfig: ',actionConfig)

    switch (message.type) {
      case MessageType.DataSourceFilterChange:
        // console.log('erddap-query: filter-change-action. got DataSourceFilterChangeMessage', message, actionConfig)
        const ds: QueriableDataSource = DataSourceManager.getInstance().getDataSource((<DataSourceFilterChangeMessage>message).dataSourceId) as QueriableDataSource
        const queryParams: SqlQueryParams = ds.getCurrentQueryParams()
        const whereClause = queryParams.where
        if (whereClause) {
          // console.log('erddap-query: filter-change-action. where: ', queryParams.where)
          queryString = queryParams.where
        } else {
          // console.log('erddap-query: filter-change-action. no where clause set')
          queryString = '1=1'
        }
    }

    //Save queryString to store
    getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'queryString', queryString));
    return true
  }
}
