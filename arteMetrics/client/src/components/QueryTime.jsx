//this component renders the tracing chart on the metrics page
import * as d3 from 'd3';
import React, { useState, useEffect, useRef } from 'react';
import loadingGif from '../assets/loading.gif';

const QueryTime = () => {
  const svgRef = useRef();
  const rootQuery = [];
  const [root, setRoot] = useState(rootQuery);
  const [queryData, setQueryData] = useState([]);

  // grab the query id by URL
  const urlParams = window.location.search;
  const id = urlParams.substr(4);

  useEffect(() => {
    fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // query for dummy apikey account
        query: `query {
          query(id: ${id}) {
            id
            name
            start_time
            end_time
            duration
            resolvers
          }
        }`
      })
    })
      .then((data) => data.json())
      .then((myJson) => {
        // queries array
        const data = myJson.data.query;
        console.log('data back: ', data);
        setQueryData(data);
      })
      .catch((err) => console.log(err));
    if (id.length > 0) {
      //fetching trace information from our database
      d3.json(`/query/${id}`).then((queries) => {
        const {
          id,
          api_key,
          name,
          start_time,
          end_time,
          duration,
          resolvers
        } = queries[0];

        rootQuery.push({
          duration
        });

        //calculating the response startOffset time
        const responseOffset =
          resolvers[resolvers.length - 1]['startOffset'] +
          resolvers[resolvers.length - 1]['duration'];

        //calculating the initial request duration
        let requestDuration = resolvers[0]['startOffset'];

        //calculating the initial request duration time
        let durationWOresponse = requestDuration;
        resolvers.forEach((val) => {
          return (durationWOresponse += val['duration']);
        });

        //calculating the response duration time
        const responseDuration = duration - durationWOresponse;

        //adding request information into resolvers array to make use of a single datasource
        resolvers.unshift({
          id,
          name,
          path: 'Request',
          duration: requestDuration,
          startOffset: 0
        });

        //pushing response information into resolvers array
        resolvers.push({
          startOffset: responseOffset,
          duration: responseDuration,
          path: 'Response'
        });

        //setting margins for the svg canvas
        const margin = { top: 10, right: 10, bottom: 10, left: 90 };

        //setting a height and width variable for svg
        const width = 1600 - margin.left - margin.right;
        const height = 1000 - margin.top - margin.bottom;

        //creating the x-axis with the domain set to 0 - the max duration value from root query and setting the range to fit the dimensions of the page
        console.log('x axis', root[0]['duration'] / 1000000);
        const x = d3
          .scaleLinear()
          .domain([0, d3.max(root, (d) => d['duration'] / 1000)])
          .range([100, width - 100]);

        //creating a svg tag and appending it to current element
        const svg = d3
          .select(svgRef.current)
          .attr('class', 'svg')
          .attr('viewBox', `0 0 1700 1100`)
          .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`)
          .attr('class', 'barChart');

        //creating an x-axis
        const xAxis = (g) => {
          g.attr('class', 'x-axis')
            .attr('transform', `translate(0, 30)`)
            .call(d3.axisTop(x));
        };
        svg.append('g').transition(1500).call(xAxis);

        //selecting rect element and using resolvers dataset to populate
        const rects = svg.selectAll('rect').data(resolvers);

        //creating the trace bars for each resolver
        rects
          .enter()
          .append('rect')
          .transition(1500)
          .attr('x', (d, i) => d['startOffset'] / 1000000)
          .attr('y', (d, i) => (i + 1) * 30)
          .attr('width', (d, i) =>
            d['duration'] / 1000000 < 1 ? 1 : d['duration'] / 1000000
          )
          .attr('height', 6)
          .attr('transform', 'translate(100, 10)')
          .attr('fill', 'navy')
          .attr('overflow-y', 'auto')
          .attr('class', 'bar');

        //selecting the svg class declared above and using resolvers dataset to populate
        const texts = svg.selectAll('.svg').data(resolvers);

        //writing the path's for each resolver and adding them adjacently to the bars above
        texts
          .enter()
          .append('text')
          .transition(1500)
          .attr('text-anchor', 'end')
          .attr('fill', 'black')
          .attr('x', (d, i) => {
            if (i === 0) return 90;
            else return d['startOffset'] / 1000000 + 90;
          })
          .attr('y', (d, i) => (i + 1) * 30)
          .attr('transform', 'translate(0, 20)')
          .attr('overflow', 'auto')
          .attr('class', 'text')
          .text((d) =>
            Array.isArray(d['path']) ? d['path'].join('.') : d['path']
          );

        //selecting the svg class and entering the resolvers dataset
        const measurements = svg.selectAll('.svg').data(resolvers);

        //writing down the duration measurement in microseconds for each resolver and adding them to the right of the bars
        measurements
          .enter()
          .append('text')
          .transition(1500)
          .attr('text-anchor', 'start')
          .attr('fill', 'red')
          .attr('font-size', '14px')
          .attr(
            'x',
            (d, i) => d['startOffset'] / 1000000 + d['duration'] / 1000000 + 110
          )
          .attr('y', (d, i) => (i + 1) * 30)
          .attr('transform', 'translate(0, 20)')
          .attr('class', 'measurement')
          .text((d) => {
            return Math.floor(d['duration'] / 1000) + ' µs';
          });

        //creating the label for the x-axis
        svg
          .append('text')
          .attr('x', width / 2)
          .attr('y', 8)
          .attr('text-anchor', 'middle')
          .text('Tracing in milliseconds (ms)');
      });
    }
  }, []);

  return (
    <div className="chartTab" style={{ overflowY: 'scroll' }}>
      <React.Fragment>
        <h4>Operation: {queryData.name}</h4>
        {queryData.start_time && id.length > 0 ? (
          <h6>Performed at: {new Date(queryData.start_time).toString()}</h6>
        ) : (
          <div className="gifPos">
            <img className="loadingGif" src={loadingGif} />
          </div>
        )}
        <svg ref={svgRef}></svg>
      </React.Fragment>
    </div>
  );
};

export default QueryTime;
