import * as d3 from 'd3';
import React, { useState, useEffect, useRef } from 'react';
import loadingGif from '../assets/loading.gif';

const QueryTime = () => {
  const svgRef = useRef();
  const startOffset = [];
  const resolverDuration = [];
  const paths = [];
  const rootQuery = [];
  const [startOffSet, setStartOffset] = useState(startOffset);
  const [root, setRoot] = useState(rootQuery);
  const [path, setPath] = useState(paths);
  const [resolver, setResolver] = useState(resolverDuration);
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
            duration
            start_time
            end_time
            resolvers
          }
        }`
      })
    })
      .then(data => data.json())
      .then(myJson => {
        // queries array
        const data = myJson.data.query;
        console.log('data back: ', data);
        setQueryData(data);
      })
      .catch(err => console.log(err));
    if (id.length > 0) {
      d3.json(`/query/${id}`).then(queries => {
        const {
          id,
          api_key,
          name,
          start_time,
          end_time,
          duration
        } = queries[0];
        rootQuery.push(id, api_key, name, start_time, end_time, duration);
        const resolvers = queries[0].resolvers;
        resolvers.forEach((info, i) => {
          startOffset.push(info['startOffset']);
          resolverDuration.push(info['duration']);
          paths.push(info['path']);
        });

        const width = 1400;
        const height = 1000;

        //this sets the main svg tag that will be used to create the chart
        const svg = d3
          .select(svgRef.current)
          .attr('class', 'svg')
          .attr('width', width)
          .attr('height', height);

        //creating the x-axis
        const x = d3
          .scaleLinear()
          .domain([0, d3.max(root, d => d / 1000)])
          .range([100, width - 100]);

        const xAxis = g => {
          g.attr('class', 'x-axis')
            .attr('transform', `translate(0, 30)`)
            .call(d3.axisTop(x));
        };

        svg.append('g').call(xAxis);

        //appending a rect tag to svg
        svg
          .append('rect')
          .attr('class', 'background')
          .attr('fill', 'none')
          .attr('width', width)
          .attr('height', height);

        //this renders the bars
        svg.selectAll('rect');

        svg
          .selectAll('rect')
          .data(root[5])
          .enter()
          .append('rect')
          .attr('x', d => d)
          .attr('y', (d, i) => (i + 1) * 30)
          .attr('width', d => d)
          .attr('height', 25)
          .attr('class', 'firstbar')
          .data(resolvers)
          .enter()
          .append('rect')
          .attr('x', (d, i) => d['startOffset'] / 1000000)
          .attr('y', (d, i) => (i + 1) * 30)
          .attr('width', (d, i) => {
            if (i === 0) return d['duration'] / 1000000;
            else return d['duration'] / 10000;
          })
          .attr('height', 6)
          .attr('transform', 'translate(100, 10)')
          .attr('fill', 'navy')
          .attr('class', 'bar');

        //this renders the path's of each bar
        svg
          .selectAll('text')
          .data(root[2])
          .enter()
          .append('text')
          .text(d => d)
          .attr('x', 0)
          .attr('y', 0)
          .data(resolvers)
          .enter()
          .append('text')
          .attr('text-anchor', 'end')
          .text(d => d['path'].join('.'))
          //  + ' ' + Math.floor(d["duration"]/1000) + 'µs')
          .attr('x', (d, i) => d['startOffset'] / 1000000 + 90)
          .attr('y', (d, i) => (i + 1) * 30)
          .attr('transform', 'translate(0, 20)')
          .attr('class', 'text');

        // svg.selectAll('text')
        //     .data(resolvers)
        //     .enter()
        //     .append('text')
        //     .attr('text-anchor', 'start')
        //     .text((d) => `d["duration"]/1000 µs`)
        //     .attr('x', (d, i) => (d["startOffset"] / 1000000) + 100)
        //     .attr('y', (d, i) => (i + 1) * 30)
        //     .attr('transform', 'translate(0, 20)')
        //     .attr('class', 'text');
      });
    }
  }, []);

  return (
    <div className="chartTab">
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
