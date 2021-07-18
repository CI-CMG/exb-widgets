# Deep-sea Corals feature counts
provides counts of the total number of features within the current map extent
and breakdowns by coral/sponge category

## How it works
When the user changes the map extent via pan or zoom operations, a new request is made to the REST API of the specified feature or map service which provides the counts based on the new map extent.  Note that counts are not updated until the view is stationary, i.e. the pan/zoom operations are complete.

Some of the underlying code is taken from the [showextent](https://github.com/Esri/arcgis-experience-builder-sdk-resources/tree/master/samples/widgets/showextent) sample in the [arcgis-experience-builder-sdk-resources](https://github.com/Esri/arcgis-experience-builder-sdk-resources) github repo.
