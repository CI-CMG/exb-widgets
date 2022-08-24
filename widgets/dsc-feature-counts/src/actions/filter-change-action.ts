import {AbstractMessageAction, MessageType, Message, getAppStore, appActions, IMSqlExpression,
    DataSourceFilterChangeMessage, DataSourceManager,QueriableDataSource, SqlQueryParams, QueryParams, MessageDescription} from 'jimu-core';

export default class FilterAction extends AbstractMessageAction{
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    console.log('inside filterMessageDescription with ', messageDescription)
    return true
  }

  filterMessageType(messageType: MessageType, messageWidgetId?: string): boolean{
    return [MessageType.DataSourceFilterChange].indexOf(messageType) > -1;
  }

  filterMessage(message: Message): boolean{return true; }

  //set action setting uri
  getSettingComponentUri(messageType: MessageType, messageWidgetId?: string): string {
    return 'actions/filter-change-action-setting';
  }

  onExecute(message: Message, actionConfig?: any): Promise<boolean> | boolean{
    // let q = `${actionConfig.fieldName} = '${message}'`
    let queryString = '1=1'
    // TODO where is actionConfig set?
    // console.log('actionConfig: ',actionConfig)

    switch(message.type){
      case MessageType.DataSourceFilterChange:
          // console.log('filter-change-action. got DataSourceFilterChangeMessage', message, actionConfig)
          const ds:QueriableDataSource = DataSourceManager.getInstance().getDataSource((<DataSourceFilterChangeMessage>message).dataSourceId) as QueriableDataSource
          const queryParams:SqlQueryParams = ds.getCurrentQueryParams()
          const whereClause = queryParams.where
          if (whereClause) {
              console.log("filter-change-action. where: ", queryParams.where)
              queryString = queryParams.where
          } else {
              // console.log("filter-change-action. no where clause set")
              queryString = '1=1'
          }
    }

    //Save queryString to store
    getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'queryString', queryString));
    return true;
  }
}