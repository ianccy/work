import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// ReactDOM.render(
//   <App />,
//   document.getElementById('root')
// );
// ReactDOM.render(
//   <h1>Hello, world!</h1>,
//   document.getElementById('root')
// );
function time(){
	return '爬蟲測試爬react測試chuian測試';
}
const aaaa = (
	<h1>{time()}</h1>
);

ReactDOM.render(
aaaa,document.getElementById('root')
);