var Sent_2 = ee.ImageCollection("COPERNICUS/S2"),
    roi = /* color: #98ff00 */ee.Geometry.Point([-33.32969166916696, 68.77513410153269]),
    test =
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-33.5420664400674, 68.76967243725574],
          [-33.411603793583026, 68.70842123723138],
          [-33.304487094364276, 68.73383850014223],
          [-33.320966586551776, 68.78905843301813]]]),
    glb_3 = /* color: #d6d40a */ee.Geometry.Polygon(
        [[[-33.62210600471438, 68.67882802463451],
          [-33.3364550926603, 68.72895477236932],
          [-33.449751756786526, 68.78269662759743],
          [-33.83359517918201, 68.71425221599189]]]),
    glb_2 = /* color: #02f9ff */ee.Geometry.Polygon(
        [[[-33.465380752139325, 68.64862768554138],
          [-33.020434463076825, 68.73371505419979],
          [-33.04941219398742, 68.77875244629895],
          [-33.621909729735954, 68.67859008684306]]]),
    glb_1 = /* color: #0b4a8b */ee.Geometry.Polygon(
        [[[-33.32856703491124, 68.63094936409544],
          [-33.00035048217686, 68.69565645609498],
          [-33.02019105860599, 68.73371310530479],
          [-33.46523741250037, 68.64855880796603]]]),
    glb_4 = /* color: #ffcb23 */ee.Geometry.Polygon(
        [[[-33.833747419951116, 68.71403599261198],
          [-33.062864802900776, 68.84897944352548],
          [-33.049589958200315, 68.8870422452644],
          [-33.826872673044065, 68.74909579420446]]]),
    glb_5 = /* color: #00e040 */ee.Geometry.Polygon(
        [[[-33.02220648873054, 68.92624809221324],
          [-33.62920111763679, 68.81982691410077],
          [-33.62461405481613, 68.78556970399869],
          [-33.04969180683996, 68.88702022771685]]]),
    glb_6 = /* color: #bf04c2 */ee.Geometry.Polygon(
        [[[-33.62921568703512, 68.81980449586823],
          [-33.022519777490395, 68.92605655241367],
          [-33.01981644484867, 68.95300620405325],
          [-33.63230423781742, 68.85067818848728]]]),
    glb_7 = /* color: #ff0000 */ee.Geometry.Polygon(
        [[[-33.4488865906127, 68.78221385046207],
          [-33.33663064231985, 68.72872456336457],
          [-33.04987084776878, 68.77880724460448],
          [-33.063260435171124, 68.84895341283402]]]),
    glb_full =
    /* color: #a4b6ff */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-33.83221435546875, 68.71639839735576],
          [-33.46142578125, 68.64750158276415],
          [-33.32958984375, 68.63099478453907],
          [-33, 68.69495331442309],
          [-33.048065185546875, 68.77762770989146],
          [-33.057527776355876, 68.8208562176397],
          [-33.063047676982315, 68.84874329252074],
          [-33.04934711965392, 68.88581161743761],
          [-33.02325459035705, 68.92633965582891],
          [-33.01913471731017, 68.95249509083077],
          [-33.63436909231017, 68.85066019295037],
          [-33.6247560552008, 68.78416587765005],
          [-33.82525654348205, 68.7493507889076]]]);

//----------------------ATCORR FUNCTION-----------------------------------------
// Use this function to correct all the images in the collection, then you will
// need to use an iteration or map function to go through each image in that
// collection to calculate the surface area.
//------------------------------------------------------------------------------

// Area of Interest (AOI) and User parameters
// Sets up the entire region to have the desired cloud coverage, location,
// dates, etc
Map.setCenter(-33.00,68.64,9);
var glacier = ee.Geometry.Point(-33.00,68.64);
var polygon = glacier.buffer(20000).bounds();//
var start_date = '2016-05-01';
//var end_date   = '2016-08-14';
//var start_date = '2016-08-15';
var end_date   = '2016-11-30';

var criteria = ee.Filter.and(
    ee.Filter.bounds(glacier), ee.Filter.date(start_date, end_date));
var cloud_perc = 20;//Max cloud percentile per scene.

var K_glacier = ee.ImageCollection(Sent_2)
                .filter(criteria)
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_perc));

//Function for mapping the correction across the entire image collection
function Sent2AtCorr(image) {

    // - Import the SIAC atmospheric correction module
    var siac = require('users/marcyinfeng/utils:SIAC');

    var S2_boa = siac.get_sur(image);
    return S2_boa;

}

//this is the data to be passed on to following functions
var Sent2_atCorr = K_glacier.map(Sent2AtCorr);
print(Sent2_atCorr);



//** method adapted from SIAC, <https://github.com/MarcYin/SIAC_GEE>, and
//   Yin, F., Lewis, P. E., Gomez-Dans, J., & Wu, Q. (2019, February 21).
//   A sensor-invariant atmospheric correction method: application to Sentinel-2/MSI and Landsat 8/OLI.
//   https://doi.org/10.31223/osf.io/ps957

//------------------------------------------------------------------------------
// Functions and settings for use in the iteration method whcih calculates the
// Surface area of the lakes
//
//------------------------------------------------------------------------------

//create a list of the image collection images
var imageList = K_glacier.toList(K_glacier.size());
print(imageList);


//Function to create a mask function for the NDWI to get all water pixels
// gt(0.2) ensures that the pixels selected represent a higher probablility of being a water
// body and not small surace area drainaige/puddles/ or anomalies in the NDWI selection
function h20mask(image) {
   return image.updateMask(image.gt(0.2));
}


//Function to determine the total area of lakes from all of the boundaries in the study area
function sumArea(arr) {
  var km_const = 1000000;
  var sum = 0;
  for(var i = 0; i < arr.length; i++) {
    var temporary = arr[i].getInfo();
    sum+= temporary['constant'];
  }
  return sum/km_const;
}

//------------------------------------------------------------------------------
// Mapping to clip the atmospherically corrected images to the glacier boundaries
// Since the server side cannot accompany user defined geometry in the iteration fucntion
// the images must be clipped to the specified boundaries first
//------------------------------------------------------------------------------

function img_clip(image) {
  return image.clip(test)

}

var sent2_atcor_clip = Sent2_atCorr.map(img_clip);


//----------------------------------------------------------------------------------------------
// ITERATION STEP
//
//----------------------------------------------------------------------------------------------
//the initial state of the object to be returned, an empty dictonary
var SGLA_dict = ee.Dictionary({});

//function for the iterator
//the iterator takes in an argument for the current image and the result of the previous image
function calc_SGLA(current, previous) {
  // var current = sent2_atcor_clip.first()
    var NDWI = current.expression(
      "(BLUE - RED) / (BLUE + RED)",
      {
      RED: current.select("B4"),    // RED
      NIR: current.select("B8"),    // NIR
      BLUE: current.select("B2")    // BLUE
      });

    //create a mask function for the NDWI to get all water pixels
    var h20_mask = h20mask(NDWI);

    //Using expression on the masked image to create binary 1 = water, 0 = not water
    var Sent_to2 = h20_mask.expression(
        '0 * S2', {
        'S2': h20_mask
        });

    var Sent_to3 = Sent_to2.expression(
        '1 + S2', {
        'S2': Sent_to2
        });

    //Generate the area and stats for the boundary area in the single image, add to an array of
    //boundary areas
    var S1_area = Sent_to3.multiply(ee.Image.pixelArea());

    var stats = S1_area.reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: glb_7,
      scale: 10,
      maxPixels: 1e12,
      tileScale: 16
      }).get('constant');

    // Get the timestamp and convert it to a date.
    var date = ee.Date(current.get('system:time_start'));

    //add the date/SA stats to the dictionary as a key value pair
    var last_dict = ee.Dictionary(previous);
    var updated = last_dict.set(date.millis(), stats);

    return updated;
    //return stats;
}

//the final result and the call to the iterator which takes the function and the initial state as
//the arguments
//var result = ee.Dictionary(Sent2_atCorr.iterate(calc_SGLA, SGLA_dict));
//print('result ', ee.Dictionary(result));


/*
print(result.evaluate(function(result) {
                            print('Client-side operations to print all key-value pairs');
                            ee.Dictionary(result).keys().forEach(function(key) {
                            print('    ' + key + ': ' + result[key]);
                                });
                             }));

*/

var result = ee.Dictionary(Sent2_atCorr.iterate(calc_SGLA, SGLA_dict));
print('result ', ee.Dictionary(result));
