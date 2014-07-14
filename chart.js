function myChart(params) {

  var margin = {top: 10, right: 20, bottom: 10, left: 55},
      width = 900,
      height = 500,
      yValue = function(d) { return d[1]; },
      scale = d3.scale.linear(),
      domain = [ 9, 18 ],
      trim = [ 10, 16 ],
      yAxis = d3.svg.axis().scale(scale).orient("right").tickSize(6, 0).tickFormat(formatTime),
      onUpdate = function() { console.log("onUpdate not defined") }

  function chart(selection) {

    // This is because we could have more than one selection?
    selection.each(function(data) {

      // Update the y-scale
      scale
        .domain(domain)
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

      // Update the y-axis
      g.select(".y.axis")
          .attr("transform", "translate(" + 0 + ", 0)")
          .call(yAxis)

      // Update events
      g.select(".events")
          .attr("transform", "translate(" + 0 + ", 0)")
          .call(updateEvents)

      // Update trim limits
      g.select("#clip-rect")
          .data([trim])
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
        .attr("x", "-10")
        .attr("y", function(d) { return scale(d[0]) })
        .attr("width", 20)
        .attr("height", function(d) { return scale(trim[1]) - scale(trim[0]) })
    })
  }

  function updateEvents(selection) {
    selection.each(function(data) {
      function updateCircle(selection) {
        selection
          .attr("cx", 0)
          .attr("cy", function(d) { return scale(d) })
          .attr("r", 6)        
      }

      var circle = d3.select(this).selectAll("circle")
          .data(data)
          
      circle
        .transition().duration(750)
        .call(updateCircle)

      circle
        .enter().append("circle")
        .call(updateCircle)

      circle.exit()
        .transition().duration(750)
        .remove()
    })
  }


  function dragmove(d) {
    var thisOne = d.i,
        other = (thisOne == 0) ? 1 : 0
    var mod = 0
    if (d.i == 0) {
      mod = Math.min(Math.max(+d3.select(this).attr("cy")  + d3.event.dy, scale(domain[0])), scale(trim[other]))
      trim = [ scale.invert(mod), trim[1] ]
    }
    else {
      mod = Math.max(+d3.select(this).attr("cy") + d3.event.dy, scale(trim[other]))
      trim = [ trim[0], scale.invert(mod) ]
    }
    d3.select(this)
      .attr("cy", mod);
    d3.select(this.parentNode.parentNode).select("#clip-rect")
      .data([trim])
      .attr("x", "-10")
      .attr("y", function(d) { return scale(d[0]) })
      .attr("width", 20)
      .attr("height", function(d) { return scale(trim[1]) - scale(trim[0]) })
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
          .attr("cy", function(d) { return scale(d.y) })
          .attr("r", 14)        
      }

      var circle = d3.select(this).selectAll("circle")
          .data(trim.map(function(d, i) { return { y: d, i: i } }))

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

  chart.x = function(_) {
    if (!arguments.length) return xValue
    xValue = _
    return chart
  }

  chart.y = function(_) {
    if (!arguments.length) return yValue
    yValue = _
    return chart
  }

  chart.domain = function(_) {
    if (!arguments.length) return domain
    domain = _
    return chart
  }

  chart.trim = function(_) {
    if (!arguments.length) return trim
    trim = _
    return chart
  }

  chart.onUpdate = function(_) {
    if (!arguments.length) return trim
    onUpdate = _
    return chart
  }

  return chart
}