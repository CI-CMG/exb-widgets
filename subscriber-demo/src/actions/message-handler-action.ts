import {
  AbstractMessageAction,
  MessageType,
  Message,
  getAppStore,
  appActions,
  MessageDescription,
  ExtentChangeMessage,
  DataSourceFilterChangeMessage
} from 'jimu-core'
import Extent from 'esri/geometry/Extent'

export default class MessageHandlerAction extends AbstractMessageAction {
  // new in v1.9, replaces filterMessageDescription. used in builder
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    // console.log('MessageHandlerAction: inside filterMessageDescription with ', messageDescription)
    return true
  }

  filterMessage (message: Message): boolean {
    // console.log('MessageHandlerAction: inside filterMessage with ', message)

    // any Message type
    return true
  }

  //set action setting uri
  getSettingComponentUri (messageType: MessageType, messageWidgetId?: string): string {
    return 'actions/message-handler-action-setting'
  }

  onExecute (message: Message, actionConfig?: any): Promise<boolean> | boolean {
    switch (message.type) {
      case MessageType.DataSourceFilterChange:
        console.log('MessageHandlerAction: got DataSourceFilterChangeMessage', message, actionConfig)
        const dataSourceFilterChangeMessage = message as DataSourceFilterChangeMessage
        // TODO since the contents of the DataSourceFilterChangeMessage don't change with the change in queryParams
        // the widget re-render is never triggered
        getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'dataSourceId', dataSourceFilterChangeMessage.dataSourceId))
        break

      case MessageType.ExtentChange:
        console.log('MessageHandlerAction: got ExtentChangeMessage', message, actionConfig)
        const extentChangeMessage = message as ExtentChangeMessage
        // trigger an update for the widget when Extent is different from previous. Must be a String?
        getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'extent', this.formatExtent(extentChangeMessage.extent)))
        break
    }

    return true
  }

  formatExtent (extent: Extent): string {
    if (!extent) { return '' }
    return `${extent.xmin}, ${extent.ymin}, ${extent.xmax}, ${extent.ymax}`
  }
}
