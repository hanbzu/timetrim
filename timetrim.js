function timetrim(params) {

  // Default style params
  var margin = {top: 20, right: 20, bottom: 20, left: 100},
      width = 150,
      height = 800,
      markerRadius = 20

  // Configurable methods
  var onUpdate = function() { console.log("onUpdate not defined") },
      parseTime = function(_) {
        if (moment.isMoment(_)) return _
        else return moment(_, 'HH:mm')
      }

  // Default functional params
  var scale = d3.scale.linear(),
      domain = [ '0:00', '24:00' ].map(parseTime),
      trim = [ '5:00', '24:00' ].map(parseTime)

  function toUnix(_) {
    return _.unix()
  }

  function fromUnix(_) {
    return moment(_, 'X')
  }

  function chart(selection) {

    // This is because we could have more than one selection?
    selection.each(function(data) {

      // Update the y-scale
      scale
        .domain(domain.map(toUnix))
        .range([0, height - margin.top - margin.bottom])

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data])

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g")
      gEnter.append("defs").append("clipPath").attr("id", "clip")
        .append("rect")
        .attr("id", "clip-rect")
      gEnter.append("g").attr("class", "y axis")
      gEnter.append("g").attr("class", "events")
        .attr("clip-path", "url(#clip)")
      gEnter.append("g").attr("class", "trim")

      // Update outer dimensions
      svg.attr("width", width)
         .attr("height", height)

      // Update inner dimensions.
      var g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      // Update events
      g.select(".events")
          .attr("transform", "translate(" + 0 + ", 0)")
          .call(updateEvents)

      // Update trim limits
      g.select("#clip-rect")
          .call(updateClipPath)
      g.select(".trim")
          .attr("transform", "translate(" + 0 + ", 0)")
          .call(updateTrimMarkers)
    })
  }

  function updateClipPath(selection) {
    selection.each(function(data) {
      d3.select(this)
        .transition().duration(750)
        .attr("x", "-20")
        .attr("y", scale(toUnix(trim[0])))
        .attr("width", 40)
        .attr("height", scale(toUnix(trim[1])) - scale(toUnix(trim[0])))
    })
  }

  function updateEvents(selection) {
    selection.each(function(data) {
      function updateCircle(selection) {
        selection
          .attr("cx", 0)
          .attr("cy", function(d) {
            return scale(toUnix(parseTime(d)))
          })
          .attr("r", 12)
      }

      var circle = d3.select(this).selectAll("circle")
          .data(data)
          
      circle
        .transition().duration(750)
        .call(updateCircle)

      circle.enter()
        .append("circle")
        .call(updateCircle)

      circle.exit()
        .remove()
    })
  }


  function dragmove(d) {
    var thisOne = d.i,
        other = (thisOne == 0) ? 1 : 0
    var mod = 0
    var pos = +d3.select(this).attr("cy") + d3.event.dy
    if (d.i == 0) {
      mod = Math.min(Math.max(scale(toUnix(domain[0])) + 1, pos), scale(toUnix(trim[other])))
      trim = [ fromUnix(scale.invert(mod)), trim[1] ]
    }
    else {
      mod = Math.max(Math.min(scale(toUnix(domain[1])) - 1, pos), scale(toUnix(trim[other])))
      trim = [ trim[0], fromUnix(scale.invert(mod)) ]
    }
    d3.select(this)
      .attr("cy", mod);
    d3.select(this.parentNode.parentNode).select("#clip-rect")
      .attr("y", scale(toUnix(trim[0])))
      .attr("height", scale(toUnix(trim[1])) - scale(toUnix(trim[0])))
    onUpdate()
  }

  function dragend(d) {
    onUpdate()
  }

  var drag = d3.behavior.drag()
    .on("drag", dragmove)
    .on("dragend", dragend)

  function updateTrimMarkers(selection) {

    selection.each(function(data) {
      function updateCircle(selection) {
        selection
          .attr("cx", 0)
          .attr("cy", function(d) { return scale(toUnix(d.value)) })
          .attr("r", markerRadius)        
      }

      var circle = d3.select(this).selectAll("circle")
          .data(trim.map(function(d, i) { return { value: d, i: i } }))

      circle
        .transition().duration(750)
        .call(updateCircle)

      circle
        .enter().append("circle")
        .call(updateCircle)
        .call(drag)

      circle.exit()
        .transition().duration(750)
        .remove()
    })
  }

  function formatTime(d) {
    function readable(h, m, s) {
      h = (h != 0) ? h.toString() + 'h ' : ''
      m = (m != 0) ? m.toString() + '\' ' : ''
      s = (s != 0) ? s.toString() + '\" ' : ''
      return h + m + s
    }
    var hours = Math.floor(d / 3600)
    d -= hours * 3600
    var minutes = Math.floor(d / 60)
    var secs = d - minutes * 60 
    return readable(hours, minutes, secs)
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin
    margin = _
    return chart
  }

  chart.width = function(_) {
    if (!arguments.length) return width
    width = _
    return chart
  }

  chart.height = function(_) {
    if (!arguments.length) return height
    height = _
    return chart
  };

  chart.domain = function(_) {
    if (!arguments.length) return domain
    domain = _.map(parseTime)
    return chart
  }

  chart.trim = function(_) {
    if (!arguments.length) return trim
    trim = _.map(parseTime)
    return chart
  }

  chart.onUpdate = function(_) {
    if (!arguments.length) return trim
    onUpdate = _
    return chart
  }

  return chart
}