function myChart(params) {

  var margin = {top: 20, right: 20, bottom: 20, left: 55},
      width = 900,
      height = 600,
      yValue = function(d) { return d[1]; },
      yScale = d3.scale.linear(),
      domain = [ 9, 18 ],
      trim = [ 10, 16 ],
      yAxis = d3.svg.axis().scale(yScale).orient("right").tickSize(6, 0).tickFormat(formatTime)

  function chart(selection) {

    // This is because we could have more than one selection?
    selection.each(function(data) {

      // Update the y-scale
      yScale
        .domain(domain)
        .range([0, height - margin.top - margin.bottom])

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data])

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g")
      var clip = gEnter.append("defs").append("clipPath").attr("id", "clip")
        .append("rect")
        .attr("id", "clip-rect")
/*        .attr("x", "-10")
        .attr("y", "0")
        .attr("width", 20)
        .attr("height", height);*/
      gEnter.append("g").attr("class", "y axis")
      gEnter.append("g").attr("class", "trim")
      gEnter.append("g").attr("class", "events")
        .attr("clip-path", "url(#clip)")

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
        .attr("y", function(d) { return yScale(d[0]) })
        .attr("width", 20)
        .attr("height", function(d) { return yScale(trim[1]) - yScale(trim[0]) })
    })
  }

  function updateEvents(selection) {
    selection.each(function(data) {
      function updateCircle(selection) {
        selection
          .attr("cx", 0)
          .attr("cy", function(d) { return yScale(d) })
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

  function updateTrimMarkers(selection) {
    selection.each(function(data) {
      function updateCircle(selection) {
        selection
          .attr("cx", 0)
          .attr("cy", function(d) { return yScale(d) })
          .attr("r", 12)        
      }

      var circle = d3.select(this).selectAll("circle")
          .data(trim)

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

  return chart
}