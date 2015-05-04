/*
 * Implements the code for handling a multi-timeseries graph
 */
function SeriesView() {

  // DOM Elements
  this.elem = null;
  this.svg  = null;
  this.selector = null;

  // The series needs to be a list of objects
  // Where each item has a period key defining the Month Year
  // And every subsequent key is the value for a particular time series
  this.series = [];

  // Defines the data fetch period and the number of elements in the series
  this.start_year  = 2000;
  this.end_year    = 2015;
  this.date_format = "MMM YYYY";

  // Base endpoint for the timeseries API
  this.base_url   = '/api/series/';

  // Other properties
  this.margin = {top: 20, right: 80, bottom: 30, left: 60};

  // Graph properties
  this.x = null;
  this.y = null;
  this.xAxis = null;
  this.yAxis = null;
  this.line  = null;
  this.color = d3.scale.category10();

  // Pass in a selector to initialize the view
  this.init = function(selector) {
    var self = this;
    this.selector = selector;
    this.elem = $(selector);

    this.svg = d3.select(this.selector).append("svg")
        .attr("width", this.width())
        .attr("height", this.height())
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");;

    this.x = d3.time.scale()
      .range([0, this.width(true)]);

    this.y = d3.scale.linear()
      .range([this.height(true), 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    this.line = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return self.x(d.period); })
      .y(function(d) { return self.y(d.value); });

    return this;
  }

  // Given a BLSID, fetch the data and draw the series
  this.fetch_series = function(blsid) {
    var self = this;
    var endpoint = this.base_url + blsid;
    endpoint += "?start_year=" + this.start_year + "&end_year=" + this.end_year;

    d3.json(endpoint, function(error, response) {
      // The JSON response contains some external info like source, title, etc.
      // The series information is in a property called `data`, which contains
      // objects that have period and value properties to add to the main series.
      var data = response.data;

      data.forEach(function(d) {
        d.period = self.parse_date(d.period); // parse the date
      });

      // Temporary - we'll have to add the series to the view next.
      self.series = data;
      self.draw();

    });

  }

  // Draw the time series into the element
  this.draw = function() {

    this.x.domain(d3.extent(this.series, function(d) { return d.period; }));
    this.y.domain(d3.extent(this.series, function(d) { return d.value; }));

    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height(true) + ")")
        .call(this.xAxis);

    this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Value");

    this.svg.append("path")
        .datum(this.series)
        .attr("class", "line")
        .attr("d", this.line);

  }


  // Helper function to parse a date string (uses moment not d3)
  this.parse_date = function(dtstr) {
    return moment(dtstr, this.date_format);
  }

  // Helper functions to get the width from the element
  // If the inner argument is true, the margins are subtracted
  this.width = function(inner) {
    if (inner) {
      return this.elem.width() - this.margin.left - this.margin.right;
    } else {
      return this.elem.width();
    }

  }

  // Helper functions to get the height from the element
  // If the inner argument is true, the margins are subtracted
  this.height = function(inner) {
    if (inner) {
      return this.elem.height() - this.margin.top - this.margin.bottom;
    } else {
      return this.elem.height();
    }

  }

}

$(function() {

  /*************************************************************************
  ** Initialization
  *************************************************************************/

  // Default Upper Series
  var DEFAULT_UPPER_SERIES = "LAUST280000000000005";
  var DEFAULT_LOWER_SERIES = "SMS28000005500000001";

  // Append "upper" and "lower" to get specific controls
  var ctrlIDs = {
    "view": "SeriesView",
    "select": "TSSelectControl",
    "label": "TSName",
    "source": "TSSource"
  }

  function initControls(prefix) {
    // Create the controls via the prefix and the selector
    var controls = _.mapObject(ctrlIDs, function(selector, key) {
      selector = "#" + prefix + selector;
      if (key=="view") {
        return new SeriesView().init(selector);
      } else {
        return $(selector);
      }
    });

    controls.fetch_series = function(blsid) {
      return this.view.fetch_series(blsid);
    }

    // Bind the selection change event
    controls.select.change(function(e) {
      var pick   = $(this).find(":selected"),
          blsid  = pick.val(),
          title  = pick.text(),
          source = pick.parent().attr("label");

      controls.label.text(title);
      controls.source.text(source);
      controls.fetch_series(blsid);
    });

    return controls;
  }

  var upperControls = initControls("upper");
  var lowerControls = initControls("lower");

  upperControls.select.val(DEFAULT_UPPER_SERIES).trigger("change");
  lowerControls.select.val(DEFAULT_LOWER_SERIES).trigger("change");

  console.log("Time Series Application Started");

});
