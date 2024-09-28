import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

// Helper function to calculate Euclidean distance between two points
const distance = (pointA, pointB) => {
  return Math.sqrt(
    (pointA[0] - pointB[0]) ** 2 + (pointA[1] - pointB[1]) ** 2
  );
};

// Helper function to compute the mean of points in a cluster
const computeMean = (points) => {
  const n = points.length;
  if (n === 0) return [0, 0];
  const sum = points.reduce(
    (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
    [0, 0]
  );
  return [sum[0] / n, sum[1] / n];
};

const App = () => {
  // State variables
  const [data, setData] = useState([]);
  const [centroids, setCentroids] = useState([]);
  const [k, setK] = useState(3); // Default to 3 clusters
  const [clusters, setClusters] = useState([]); // Cluster assignments
  const [initializationMethod, setInitializationMethod] = useState('Random'); // Default initialization method
  const [isManualMode, setIsManualMode] = useState(false); // Track if we are in manual mode
  const [isRunning, setIsRunning] = useState(false); // Track if convergence is running

  // Refs to store mutable variables and plot information
  const plotInfoRef = useRef({});
  const isConvergedRef = useRef(false);
  const isRunningRef = useRef(false);
  const clustersRef = useRef([]);
  const centroidsRef = useRef([]);

  // Synchronize refs with state
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    centroidsRef.current = centroids;
  }, [centroids]);

  useEffect(() => {
    clustersRef.current = clusters;
  }, [clusters]);

  // Handle changes in k by resetting the state
  useEffect(() => {
    reset(); // Reset all when k changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);

  // Define the width and height for the D3 plot
  const width = 600;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 50, left: 50 };

  // Color palette for clusters
  const colors = d3.schemeCategory10;

  // Function to generate random data in the range [-10, 10]
const generateData = () => {
  const numPoints = 200; // Increase points to give a denser plot
  const generatedData = d3.range(numPoints).map(() => [
    Math.random() * 20 - 10, // X range: [-10, 10]
    Math.random() * 20 - 10  // Y range: [-10, 10]
  ]);
  setData(generatedData);
  reset(); // Reset the state when new data is generated
  console.log('Generated new data.');
};

// Function to initialize the D3 plot with centered axes
const initPlot = () => {
  // Clear any existing SVGs
  d3.select('#d3-container').selectAll('*').remove();

  // Create SVG container
  const svg = d3.select('#d3-container').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Define scales (adjusting range from -10 to 10)
  const xScale = d3.scaleLinear().domain([-10, 10]).range([0, width]);
  const yScale = d3.scaleLinear().domain([-10, 10]).range([height, 0]);

  // Add X Axis (with gridlines and labels)
  svg.append('g')
    .attr('transform', `translate(0, ${height / 2})`) // Center the x-axis
    .call(d3.axisBottom(xScale).ticks(10).tickSizeOuter(0))  // Remove outer ticks
    .call(g => g.select(".domain").attr("stroke", "black"))   // Axis color
    .call(g => g.selectAll(".tick line").attr("stroke", "black"))  // Tick color
    .call(g => g.selectAll(".tick text").attr("fill", "black").style("font-size", "12px")); // Text color and size

  // Add Y Axis (with gridlines and labels)
  svg.append('g')
    .attr('transform', `translate(${width / 2}, 0)`) // Center the y-axis
    .call(d3.axisLeft(yScale).ticks(10).tickSizeOuter(0))  // Remove outer ticks
    .call(g => g.select(".domain").attr("stroke", "black"))   // Axis color
    .call(g => g.selectAll(".tick line").attr("stroke", "black"))  // Tick color
    .call(g => g.selectAll(".tick text").attr("fill", "black").style("font-size", "12px")); // Text color and size

  // Add a transparent rectangle to capture click events
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'transparent') // Make it invisible
    .style('cursor', isManualMode ? 'crosshair' : 'default') // Change cursor in manual mode
    .on('click', handleManualCentroidPlacement); // Bind click handler

  // Store plot information in ref
  plotInfoRef.current = { svg, xScale, yScale };

  return { svg, xScale, yScale };
};



  // Function to render data points with color coding based on clusters
  const renderDataPoints = (svg, xScale, yScale) => {
    // Bind data
    const points = svg.selectAll('.data-point').data(data);

    // Enter
    points.enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => yScale(d[1]))
      .attr('r', 5)
      .attr('fill', (d, i) => clustersRef.current[i] !== undefined ? colors[clustersRef.current[i] % colors.length] : 'blue') // Use color coding for clusters
      .append('title') // Add tooltip
      .text((d, i) => clustersRef.current[i] !== undefined ? `Cluster ${clustersRef.current[i] + 1}: (${d[0].toFixed(2)}, ${d[1].toFixed(2)})` : `(${d[0].toFixed(2)}, ${d[1].toFixed(2)})`);

    // Update
    points
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => yScale(d[1]))
      .attr('fill', (d, i) => clustersRef.current[i] !== undefined ? colors[clustersRef.current[i] % colors.length] : 'blue')
      .select('title')
      .text((d, i) => clustersRef.current[i] !== undefined ? `Cluster ${clustersRef.current[i] + 1}: (${d[0].toFixed(2)}, ${d[1].toFixed(2)})` : `(${d[0].toFixed(2)}, ${d[1].toFixed(2)})`);

    // Exit
    points.exit().remove();
  };

 // Function to render centroids with color corresponding to their cluster
const renderCentroids = (svg, xScale, yScale, centroids, clusters) => {
  const centroidSelection = svg.selectAll('.centroid').data(centroids);

  // Enter
  centroidSelection.enter()
    .append('circle')
    .attr('class', 'centroid')
    .attr('cx', d => xScale(d[0]))
    .attr('cy', d => yScale(d[1]))
    .attr('r', 10)
    .attr('fill', (d, i) => colors[i % colors.length]) // Match centroid color to the cluster
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .append('title') // Add tooltip for centroids
    .text((d, i) => `Centroid: (${d[0].toFixed(2)}, ${d[1].toFixed(2)})`);

  // Update
  centroidSelection
    .attr('cx', d => xScale(d[0]))
    .attr('cy', d => yScale(d[1]))
    .attr('fill', (d, i) => colors[i % colors.length]) // Match centroid color to the cluster
    .select('title')
    .text(d => `Centroid: (${d[0].toFixed(2)}, ${d[1].toFixed(2)})`);

  // Exit
  centroidSelection.exit().remove();
};

  // Handle manual centroid placement
  const handleManualCentroidPlacement = (event) => {
    if (!isManualMode || centroids.length >= k || isRunning) return;

    const [xPos, yPos] = d3.pointer(event);
    const { xScale, yScale } = plotInfoRef.current;
    const newCentroid = [xScale.invert(xPos), yScale.invert(yPos)];
    console.log('Placing centroid:', newCentroid);

    setCentroids(prev => {
      const updatedCentroids = [...prev, newCentroid];
      console.log(`Centroid ${updatedCentroids.length}:`, newCentroid);
      if (updatedCentroids.length === k) {
        setIsManualMode(false); // Exit manual mode after placing all centroids
        console.log('All manual centroids placed:', updatedCentroids);
      }
      return updatedCentroids;
    });
  };

  // Initialize centroids based on the selected method
  const initializeCentroids = () => {
    if (isManualMode || data.length === 0) return;

    let newCentroids = [];
    if (initializationMethod === 'Random') {
      for (let i = 0; i < k; i++) {
        newCentroids.push(data[Math.floor(Math.random() * data.length)]);
      }
    } else if (initializationMethod === 'Farthest First') {
      newCentroids.push(data[Math.floor(Math.random() * data.length)]);
      while (newCentroids.length < k) {
        let farthestPoint = null;
        let maxDistance = -1;
        for (let i = 0; i < data.length; i++) {
          let minDistanceToCentroid = Math.min(...newCentroids.map(c => distance(data[i], c)));
          if (minDistanceToCentroid > maxDistance) {
            maxDistance = minDistanceToCentroid;
            farthestPoint = data[i];
          }
        }
        newCentroids.push(farthestPoint);
      }
    } else if (initializationMethod === 'KMeans++') {
      newCentroids.push(data[Math.floor(Math.random() * data.length)]);
      while (newCentroids.length < k) {
        let distances = data.map(point => Math.min(...newCentroids.map(c => distance(point, c))));
        let squaredDistances = distances.map(d => d * d);
        let sumSquaredDistances = squaredDistances.reduce((a, b) => a + b, 0);
        let probabilities = squaredDistances.map(d => d / sumSquaredDistances);
        let cumulativeProbabilities = [];
        probabilities.reduce((acc, prob, i) => {
          acc += prob;
          cumulativeProbabilities[i] = acc;
          return acc;
        }, 0);
        let randomValue = Math.random();
        let selectedPointIndex = cumulativeProbabilities.findIndex(p => p > randomValue);
        if (selectedPointIndex === -1) selectedPointIndex = probabilities.length - 1;
        newCentroids.push(data[selectedPointIndex]);
      }
    }

    setCentroids(newCentroids);
    setClusters([]);
    centroidsRef.current = newCentroids;
    clustersRef.current = [];
    console.log('Initialized centroids:', newCentroids);
  };

  // Step through KMeans algorithm (one iteration)
  const stepKMeans = () => {
    if (centroids.length !== k || isRunning) return;

    // Assign clusters
    const newClusters = data.map(point => {
      const distancesToCentroids = centroidsRef.current.map(centroid => distance(point, centroid));
      return distancesToCentroids.indexOf(Math.min(...distancesToCentroids));
    });

    // Check if clusters have changed
    const clustersChanged = clustersRef.current.length === 0 || newClusters.some((cluster, i) => cluster !== clustersRef.current[i]);

    // Update clusters
    setClusters(newClusters);
    console.log('Step KMeans: updated clusters.');

    if (!clustersChanged) {
      console.log('Converged');
      isConvergedRef.current = true;
      return;
    }

    // Recompute centroids
    const newCentroids = [];
    for (let i = 0; i < k; i++) {
      const pointsInCluster = data.filter((_, idx) => newClusters[idx] === i);
      if (pointsInCluster.length === 0) {
        newCentroids.push(data[Math.floor(Math.random() * data.length)]);
      } else {
        newCentroids.push(computeMean(pointsInCluster));
      }
    }

    setCentroids(newCentroids);
    console.log('Step KMeans: updated centroids.');
  };

  // Run KMeans to convergence
  const runToConvergence = () => {
    if (centroids.length !== k || isRunning) return;

    setIsRunning(true);
    isConvergedRef.current = false;

    const iterate = () => {
      if (isConvergedRef.current || !isRunningRef.current) {
        setIsRunning(false);
        console.log('Run to convergence stopped.');
        return;
      }

      // Assign clusters
      const newClusters = data.map(point => {
        const distancesToCentroids = centroidsRef.current.map(centroid => distance(point, centroid));
        return distancesToCentroids.indexOf(Math.min(...distancesToCentroids));
      });

      // Check if clusters have changed
      const clustersChanged = clustersRef.current.length === 0 || newClusters.some((cluster, i) => cluster !== clustersRef.current[i]);

      // Update clusters
      setClusters(newClusters);
      console.log('Run to Convergence: updated clusters.');

      if (!clustersChanged) {
        console.log('Converged');
        isConvergedRef.current = true;
        setIsRunning(false);
        return;
      }

      // Recompute centroids
      const newCentroids = [];
      for (let i = 0; i < k; i++) {
        const pointsInCluster = data.filter((_, idx) => newClusters[idx] === i);
        if (pointsInCluster.length === 0) {
          newCentroids.push(data[Math.floor(Math.random() * data.length)]);
        } else {
          newCentroids.push(computeMean(pointsInCluster));
        }
      }

      setCentroids(newCentroids);
      console.log('Run to Convergence: updated centroids.');

      // Use requestAnimationFrame for the next iteration
      requestAnimationFrame(iterate);
    };

    // Start the iteration process
    requestAnimationFrame(iterate);
  };

  // Reset the plot and state
  const reset = () => {
    setCentroids([]);
    setClusters([]);
    setIsManualMode(initializationMethod === 'Manual');
    setIsRunning(false);
    isConvergedRef.current = false;
    clustersRef.current = [];
    centroidsRef.current = [];
    d3.select('#d3-container').selectAll('*').remove();
    console.log('Reset the application.');
  };

  // Handle Initialization Method Change
  const handleInitializationMethodChange = (e) => {
    const method = e.target.value;
    setInitializationMethod(method);
    setIsManualMode(method === 'Manual');
    setCentroids([]);
    setClusters([]);
    setIsRunning(false);
    isConvergedRef.current = false;
    clustersRef.current = [];
    centroidsRef.current = [];
    d3.select('#d3-container').selectAll('*').remove();
    console.log(`Switched to ${method} Initialization Mode.`);
  };

  // Generate data on component mount
  useEffect(() => {
    generateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize D3 plot and render points whenever the data or centroids change
  useEffect(() => {
    if (data.length > 0) {
      const { svg, xScale, yScale } = initPlot();
      renderDataPoints(svg, xScale, yScale);
      if (centroids.length > 0) {
        renderCentroids(svg, xScale, yScale, centroids, 'red');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, centroids, clusters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
      <h1>KMeans Clustering Visualization (D3)</h1>
      {/* Initialization Method Selection */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ marginRight: '10px' }}>
          Select Initialization Method:{' '}
          <select value={initializationMethod} onChange={handleInitializationMethodChange}>
            <option value="Random">Random</option>
            <option value="Farthest First">Farthest First</option>
            <option value="KMeans++">KMeans++</option>
            <option value="Manual">Manual</option>
          </select>
        </label>

        {/* Number of Clusters Selection */}
        <label>
          Number of clusters (k):{' '}
          <input
            type="number"
            value={k}
            min="1"
            max={data.length}
            onChange={(e) => setK(Number(e.target.value))}
            disabled={isRunning}
          />
        </label>
      </div>

      {/* Control Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'row'}}>
        <button onClick={generateData} disabled={isRunning}>
          Generate New Data
        </button>
        <button onClick={initializeCentroids} disabled={isManualMode || isRunning}>
          Initialize Centroids
        </button>
        <button onClick={stepKMeans} disabled={centroids.length !== k || isRunning}>
          Step Through KMeans
        </button>
        <button onClick={runToConvergence} disabled={centroids.length !== k || isRunning}>
          Run to Convergence
        </button>
        <button onClick={reset} disabled={isRunning}>
          Reset
        </button>
      </div>

      {/* D3 Plot Container */}
      <div
        id="d3-container"
        style={{ width: '600px', height: '600px', position: 'relative', marginTop: '20px' }}
      />
    </div>
  );
};

export default App;
