import Extent from 'esri/geometry/Extent';
import {AbstractMessageAction, MessageType, Message, getAppStore, appActions, IMSqlExpression,
  DataRecordSetChangeMessage, DataRecordsSelectionChangeMessage, DataSourceFilterChangeMessage, 
  ExtentChangeMessage, StringSelectionChangeMessage, MessageDescription,
  DataSourceManager,QueriableDataSource, SqlQueryParams, QueryParams, SelectDataRecordMessage} from 'jimu-core';

export default class FilterAction extends AbstractMessageAction {
  extentString:string = null
  queryString:string = '1=1'

  filterMessageDescription (messageDescription: MessageDescription): boolean {
    console.log('inside filterMessageDescription with ', messageDescription)
    return true
  }

  filterMessageType(messageType: MessageType, messageWidgetId?: string): boolean {
    return [
      MessageType.DataSourceFilterChange, MessageType.DataRecordSetChange, 
      MessageType.DataRecordsSelectionChange, MessageType.ExtentChange, 
      MessageType.SelectDataRecord, MessageType.StringSelectionChange
    ].indexOf(messageType) > -1;
  }

  // allow any message
  filterMessage(message: Message): boolean{return true; }

  //set action setting uri
  getSettingComponentUri(messageType: MessageType, messageWidgetId?: string): string {
    return 'actions/message-receiver-action-setting';
  }

  onExecute(message: Message, actionConfig?: any): Promise<boolean> | boolean{
    // TODO where is actionConfig set?
    console.log('actionConfig: ',actionConfig)

    switch(message.type){
      case MessageType.DataSourceFilterChange:
        console.log('got DataSourceFilterChangeMessage', message, actionConfig)
        const ds:QueriableDataSource = DataSourceManager.getInstance().getDataSource((<DataSourceFilterChangeMessage>message).dataSourceId) as QueriableDataSource
        const queryParams:SqlQueryParams = ds.getCurrentQueryParams()
        const whereClause = queryParams.where
        if (whereClause) {
          // console.log("where: ", queryParams.where)
          this.queryString = whereClause
        } else {
          // console.log("no where clause set")
          this.queryString = '1=1'
        }
        break

      case MessageType.DataRecordSetChange:
        console.log('got DataRecordSetChangeMessage', <DataRecordSetChangeMessage>message, actionConfig)
        break

      case MessageType.DataRecordsSelectionChange:
        console.log('got DataRecordsSelectionChangeMessage', <DataRecordsSelectionChangeMessage>message, actionConfig)
        break

      case MessageType.ExtentChange:
          console.log('got ExtentChangeMessage', <ExtentChangeMessage>message, actionConfig)
          // TODO not sure why VSCode doesn't like "message.extent"
          const extent:Extent = message['extent']
          this.extentString = `${extent.xmin.toFixed(0)},${extent.ymin.toFixed(0)},${extent.xmax.toFixed(0)},${extent.ymax.toFixed(0)}`
          console.log(this.extentString)
          break

      case MessageType.SelectDataRecord:
        console.log('got SelectDataRecordChangeMessage', <SelectDataRecordMessage>message, actionConfig)
        break

      case MessageType.StringSelectionChange:
        console.log('got StringSelectionChangeMessage', <StringSelectionChangeMessage>message, actionConfig)
        break

      default:
        console.error(`Unrecognized MessageType: ${message.type}`, message)
    }
        
    //Save queryString to store
    getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'queryString', this.queryString));
    getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'extentString', this.extentString));

    return true;
  }
}