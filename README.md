# exb-widgets
custom widgets for ArcGIS Experience Builder.  Intended to be installed in `<ArcGIS Experience Builder install directory>/client/your-extensions/widgets`.

Some widgets derived from samples in [arcgis-experience-builder-sdk-resources](https://github.com/Esri/arcgis-experience-builder-sdk-resources) github repo.

* [**configurable-nav-menu**](https://github.com/CI-CMG/exb-widgets/tree/main/configurable-nav-menu) reads a list of label/URL pairs from an external file and displays a menu of links
* [**database-version**](https://github.com/CI-CMG/exb-widgets/tree/main/database-version) reads an external file containing version number and displays it. INCOMPLETE
*  [**datasource-record-count**](https://github.com/CI-CMG/exb-widgets/tree/main/datasource-record-count) displays the total number of records and the number considering any active filters
*  [**dsc-feature-counts**](https://github.com/CI-CMG/exb-widgets/tree/main/dsc-feature-counts) displays the feature counts grouped by verncaular name category, scientific name, or taxon. Constrained by any active filters and the current map extent
*  [**erdap-query**](https://github.com/CI-CMG/exb-widgets/tree/main/erddap-query) constructs an ERDDAP download URL based on current map extent and datasource filters
*  [**get-map-coordinates**](https://github.com/CI-CMG/exb-widgets/tree/main/get-map-coordinates) Displays the current geographic coordinates of the pointer
*  [**layer-listener**](https://github.com/CI-CMG/exb-widgets/tree/main/layer-listener) Listens for changes in map extent and/or datasource filter. When zoom passes specified threshold OR a datasource filter is applied, swithes the visibility of the aggregate binned layer for the points layer.
*  [**map-update-status**](https://github.com/CI-CMG/exb-widgets/tree/main/map-update-status) Displays a message when map is actively being redrawn
*  [**subscriber-demo**](https://github.com/CI-CMG/exb-widgets/tree/main/subscriber-demo) demonstration of various approaches for getting a widget to respond to changes in the map view extent and/or datasource filter
*  [**taxon-selector**](https://github.com/CI-CMG/exb-widgets/tree/main/taxon-selector) allows the selection of phylum/class/order/family/genus and applying the selection as datasource filter. The list of options in each Select widget is driven by unique values in the datasource and each choice modifies the available options for the Select widgets lower in the heirarchy 
