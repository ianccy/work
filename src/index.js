import React from 'react';
import ReactDOM from 'react-dom';
import Application from './container/Application.js';
const url = "https://app.voicetube.com/rand_data.json";
const sort = [{name:'發佈時間',type:'publish'},
              {name:'觀看次數',type:'views'},
              {name:'收藏次數',type:'collectCount'},
            ];
const filter = [{name:'不限',type:'',dur:''},
              {name:'4分鐘以下',type:'down',dur:'240'},
              {name:'5-10分鐘',type:'range',dur:'300-600'},
              {name:'超過10分鐘',type:'up',dur:'600'},
            ];
ReactDOM.render( 
	<div>
    <Application url={url} sort={sort} filter={filter}/>
    </div>,
    document.getElementById('root')
);