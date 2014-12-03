function timetrim(params) {

  // Default style params
  var margin = {top: 20, right: 20, bottom: 20, left: 100},
      width = 150,
      height = 800,
      markerRadius = 20,
      rangeWidth = 16

  // Configurable methods
  var onUpdate = function() { console.log('onUpdate not defined') },
      parseTime = function(_) {
        if (moment.isMoment(_)) return _
        else return moment(_, 'HH:mm')
      }

  // Default functional params
  var scale = d3.scale.linear(),
      lineFun = d3.svg.line().x(function(d) { return d.x }).y(function(d) { return d.y }),
      outerBounds = [ '0:00', '24:00' ].map(parseTime),
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

      // Update the scale
      scale
        .domain(outerBounds.map(toUnix))
        .range([0, height - margin.top - margin.bottom])

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll('svg').data([data])

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append('svg').append('g')
      // 1. Clip path
      gEnter.append('defs').append('clipPath').attr('id', 'clip')
        .append('rect')
          .attr('id', 'clip-rect')
      // 2. Axis
      gEnter.append('g')
          .attr('class', 'axis')
        .append('path')
          .attr('d', lineFun([ { x:0, y:0 }, { x:0, y:scale.range()[1] } ]))
      // 3. Events
      gEnter.append('g').attr('class', 'events')
          .attr('clip-path', 'url(#clip)')
        .append('rect')
          .attr('x', -rangeWidth/2).attr('y', 0).attr('width', rangeWidth).attr('height', scale.range()[1])
      // 4. Trim markers
      gEnter.append('g').attr('class', 'trim from')
        .datum(trim[0])
        .call(createMark)
      gEnter.append('g').attr('class', 'trim to')
        .datum(trim[1])
        .call(createMark)
            
      // Update outer dimensions
      svg.attr('width', width)
         .attr('height', height)

      // Update inner dimensions.
      var g = svg.select('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      // Update events
      g.select('.events')
          .attr('transform', 'translate(' + 0 + ', 0)')
          .call(updateEvents)

      // Update trim limits
      g.select('#clip-rect')
          .call(updateClipPath)
      g.select('.from').datum(trim[0])
        .call(updateMark)
      g.select('.to').datum(trim[1])
        .call(updateMark)
    })
  }


  function dragmove(d) {
    var yPixel = d3.transform(d3.select(this).attr('transform')).translate[1] + d3.event.dy,
        newValue = 0

    function computeValue(bounds) {
      bounds = bounds.map(toUnix).map(scale)
      yPixel = Math.max(bounds[0], Math.min(yPixel, bounds[1]))
      newValue = fromUnix(scale.invert(yPixel)) 
      return newValue
    }

    if (d3.select(this).classed('from')) // from
      trim = [ computeValue([ outerBounds[0], trim[1] ]), trim[1] ]
    else // to
      trim = [ trim[0], computeValue([ trim[0], outerBounds[1] ]) ]

    d3.select(this)
      .datum(newValue)
      .attr('transform', 'translate(0, ' + yPixel + ')')
    d3.select(this).select('text').text(newValue.format('H:mm'))
    d3.select(this.parentNode.parentNode).select('#clip-rect')
      .attr('y', scale(toUnix(trim[0])))
      .attr('height', scale(toUnix(trim[1])) - scale(toUnix(trim[0])))
    onUpdate()
  }

  var drag = d3.behavior.drag()
    .on('drag', dragmove)
    .on('dragend', function() { onUpdate() })

  function updateMark(selection) {
    selection.each(function(data) {
      console.log('updateMark ' + data.format('H:mm'))
      var mark = d3.select(this)
        .transition().duration(750)
          .attr('transform', 'translate(0, ' + scale(toUnix(data)) + ')')
      mark.select('text')
        .text(data.format('H:mm'))
    })
  }

  function createMark(selection) {
    selection.each(function(data) {
      var mark = d3.select(this)
        .attr('transform', 'translate(0, ' + scale(toUnix(data)) + ')')
        .call(drag)
      mark.append('circle')
        .attr('cx', 0)
        .attr('r', markerRadius)
      mark.append('text')
        .attr('x', -markerRadius -10)
        .attr('y', 8) // Depends on the font size -- should be externally configurable
        .attr('text-anchor', 'end')
    })
  }

  function updateClipPath(selection) {
    selection.each(function(data) {
      d3.select(this)
        .transition().duration(750)
        .attr('x', '-20')
        .attr('y', scale(toUnix(trim[0])))
        .attr('width', 40)
        .attr('height', scale(toUnix(trim[1])) - scale(toUnix(trim[0])))
    })
  }

  function updateEvents(selection) {
    selection.each(function(data) {
      function updateTick(selection) {
        selection
          .attr('d', function(d) {
            var y = scale(toUnix(parseTime(d)))
            return lineFun([
              { x: -rangeWidth/2, y: y },
              { x: rangeWidth/2, y: y }
            ])
          })
      }
      var tick = d3.select(this).selectAll('path')
          .data(data)
          
      tick
        .transition().duration(750)
        .call(updateTick)

      tick.enter()
        .append('path')
        .call(updateTick)

      tick.exit()
        .remove()
    })
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

  chart.outerBounds = function(_) {
    if (!arguments.length) return outerBounds
    outerBounds = _.map(parseTime)
    return chart
  }

  chart.trim = function(_) {
    if (!arguments.length) return trim
    trim = _.map(parseTime)
    return chart
  }

  chart.onUpdate = function(_) {
    onUpdate = _
    return chart
  }

  return chart
}