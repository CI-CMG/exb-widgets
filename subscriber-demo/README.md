# subscriber-demo widget

## example demonstrating inter-widget communication

Objective is to be able to respond to changes in map extent or datasource filter changes.

Two approaches being used:
1) use framework [Message](https://developers.arcgis.com/experience-builder/api-reference/jimu-core/Message),
e.g. EXTENT_CHANGE, DATA_SOURCE_FILTER_CHANGE.
The problem with this approach is how to trigger an action in the Widget from the message handler class.

2) watch the [MapView](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html) extent property and the [QueriableDataSource](https://developers.arcgis.com/experience-builder/api-reference/jimu-core/QueriableDataSource)'s [getCurrentQueryParams][https://developers.arcgis.com/experience-builder/api-reference/jimu-core/QueriableDataSource#getCurrentQueryParams].

The problem with this approach is errors when calling getCurrentQueryParams in setting up the [watch](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-reactiveUtils.html)
