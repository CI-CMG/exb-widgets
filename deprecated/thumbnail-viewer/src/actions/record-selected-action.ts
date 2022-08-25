import {AbstractMessageAction, MessageType, Message, getAppStore, appActions, IMSqlExpression,
  DataRecordSetChangeMessage, DataRecordsSelectionChangeMessage, DataSourceFilterChangeMessage, 
  ExtentChangeMessage, StringSelectionChangeMessage,
  DataSourceManager,QueriableDataSource, SqlQueryParams, QueryParams, SelectDataRecordMessage} from 'jimu-core';

export default class FilterAction extends AbstractMessageAction{
  filterMessageType(messageType: MessageType, messageWidgetId?: string): boolean {
    return [MessageType.DataRecordsSelectionChange].indexOf(messageType) > -1;
  }

  // allow any message
  filterMessage(message: Message): boolean{return true; }

  //set action setting uri
  getSettingComponentUri(messageType: MessageType, messageWidgetId?: string): string {
    return 'actions/record-selected-action-setting';
  }

  onExecute(message: Message, actionConfig?: any): Promise<boolean> | boolean{
    // TODO where is actionConfig set?
    console.log('actionConfig: ',actionConfig)
    let imageUrl = null
    
    switch(message.type){
      case MessageType.DataRecordsSelectionChange:
        console.log('got DataRecordsSelectionChangeMessage', <DataRecordsSelectionChangeMessage>message, actionConfig)
        console.log(message.records)
        if (message['records'].length) {
          // always one record?
          console.log(`found ${message['records'].length} records`, message['records']) 
          const attributes = message['records'][0].feature.attributes
          if (attributes.ImageURL) {
            imageUrl = attributes.ImageURL
          }
        } else {
          console.log('no records for this message')
        }
        break

      default:
        console.error(`Unrecognized MessageType: ${message.type}`, message)
    }
        

    // save ImageURL to store
    getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'imageUrl', imageUrl));
    return true;
  }
}