import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 引入 Arco Design 样式
import '@arco-design/web-react/dist/css/arco.css';

// 初始化主题
const initTheme = localStorage.getItem('app_theme');
if (initTheme === 'dark') {
  document.body.setAttribute('theme-mode', 'dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
