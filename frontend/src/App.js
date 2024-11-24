import React from "react";
import ControlPanel from "./components/ControlPanel";
import LogsViewer from "./components/LogsViewer";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Snipe.io Dashboard</h1>
        <ControlPanel />
        <LogsViewer />
      </header>
    </div>
  );
}

export default App;
