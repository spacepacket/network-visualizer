import React, { useEffect, useState, useCallback } from 'react';
import { ForceGraph3D } from 'react-force-graph';
import * as THREE from 'three';
import Papa from 'papaparse';
import ReactDOM from 'react-dom';


function FileUpload({ onFileUpload }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      onFileUpload(fileUrl);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
    </div>
  );
}

function Main() {
  const [fileUrl, setFileUrl] = useState(null);

  return (
    <div>
      <FileUpload onFileUpload={setFileUrl} />
      {fileUrl && <App fileUrl={fileUrl} />}
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
  document.getElementById('root')
);

function App({ fileURL }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const loadCSVData = useCallback(async () => {
    const response = await fetch(fileURL);
    const text = await response.text();
  
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          resolve(results.data);
        },
      });
    });
  }, [fileURL]);

  useEffect(() => {
    const fetchData = async () => {
      const csvData = await loadCSVData();
      const graphData = csvToGraphData(csvData);
      setGraphData(graphData);
    };
    fetchData();
  }, [loadCSVData]);

  const csvToGraphData = (csvData) => {
    const nodesSet = new Set();
    const nodes = [];
    const links = [];
  
    csvData.forEach((row) => {
      const clientAddr = row['Client Addr'];
      const serverAddr = row['Server Addr'];
      const sumBytes = row['Server Bytes'] + row['Client Bytes'];
      const clientEvents = row['Events'];
  
      if (!nodesSet.has(clientAddr)) {
        nodes.push({ id: clientAddr, label: clientAddr, group: 1, events: clientEvents });
        nodesSet.add(clientAddr);
      }
      if (!nodesSet.has(serverAddr)) {
        nodes.push({ id: serverAddr, label: serverAddr, group: 2, events: 0 });
        nodesSet.add(serverAddr);
      }
  
      links.push({ source: clientAddr, target: serverAddr, sumBytes });
    });

    return { nodes, links };
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const contents = e.target.result;
        // Parsing the CSV data
        Papa.parse(contents, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const graphData = csvToGraphData(results.data);
            setGraphData(graphData);
          },
        });
      };
      reader.readAsText(file);
    }
  };  

  return (
    <div className="App">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".csv"
        style={{ marginBottom: '16px' }}
      />
      <ForceGraph3D
        graphData={graphData}
        nodeLabel="label"
        nodeAutoColorBy="group"
        nodeThreeObject={node => {
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(node.id === 'node6' || node.id === 'node1' ? 10 : 5),
            new THREE.MeshBasicMaterial({ color: node.events > 0 ? 'red' : node.color })
          );
          return sphere;
        }}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.008}
        linkWidth={(link) => Math.sqrt(link.sumBytes) / 500} // Adjust the denominator to control the line width
 
        onNodeDragStart={node => {
          node.fx = node.x;
          node.fy = node.y;
          node.fz = node.z;
        }}
        onNodeDrag={node => {
          node.fx = node.x;
          node.fy = node.y;
          node.fz = node.z;
        }}
        onNodeDragEnd={node => {
      
        }}
      />
    </div>
  );
}

export default App;
