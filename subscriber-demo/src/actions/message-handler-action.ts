import {
  AbstractMessageAction,
  MessageType,
  Message,
  getAppStore,
  appActions,
  MessageDescription
} from 'jimu-core'

export default class MessageHandlerAction extends AbstractMessageAction {
  // new in v1.9, replaces filterMessageDescription. used in builder
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    console.log('MessageHandlerAction: inside filterMessageDescription with ', messageDescription)
    return true
  }

  filterMessage (message: Message): boolean {
    console.log('MessageHandlerAction: inside filterMessage with ', message)

    // any Message type
    return true
  }

  //set action setting uri
  getSettingComponentUri (messageType: MessageType, messageWidgetId?: string): string {
    return 'actions/message-handle-raction-setting'
  }

  onExecute (message: Message, actionConfig?: any): Promise<boolean> | boolean {
    switch (message.type) {
      case MessageType.DataSourceFilterChange:
        console.log('MessageHandlerAction: got DataSourceFilterChangeMessage', message, actionConfig)

        // trigger an update for the widget
        getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'lastMessage', message.type))
        break

      case MessageType.ExtentChange:
        console.log('MessageHandlerAction: got ExtentChangeMessage', message, actionConfig)

        //trigger an update for the widget - not working!
        getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'lastMessage', message.type))
        break
    }

    return true
  }
}
