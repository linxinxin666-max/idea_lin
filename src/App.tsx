import { useState } from 'react';
import './App.css';
import { PERSONAS, CONTENT_TYPES, generateContent } from './data';
import { Persona, ContentType, GeneratedContent } from './types';

function App() {
  const [selectedPersona, setSelectedPersona] = useState<string>(PERSONAS[0].id);
  const [selectedContentType, setSelectedContentType] = useState<string>(CONTENT_TYPES[0].id);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const content = generateContent(selectedPersona, selectedContentType);
    setGeneratedContent(content);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✨</span>
            <h1>Idea Creator</h1>
          </div>
          <p className="subtitle">朋友圈素材生成器 - 助力销售增长</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <section className="section">
            <h2 className="section-title">
              <span className="section-icon">👤</span>
              选择人设
            </h2>
            <div className="persona-grid">
              {PERSONAS.map((persona) => (
                <div
                  key={persona.id}
                  className={`persona-card ${selectedPersona === persona.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPersona(persona.id)}
                >
                  <div className="persona-icon">{persona.icon}</div>
                  <div className="persona-name">{persona.name}</div>
                  <div className="persona-desc">{persona.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">
              <span className="section-icon">📝</span>
              选择内容类型
            </h2>
            <div className="content-type-grid">
              {CONTENT_TYPES.map((type) => (
                <div
                  key={type.id}
                  className={`content-type-card ${selectedContentType === type.id ? 'selected' : ''}`}
                  onClick={() => setSelectedContentType(type.id)}
                >
                  <div className="content-type-icon">{type.icon}</div>
                  <div className="content-type-name">{type.name}</div>
                  <div className="content-type-desc">{type.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="generate-section">
              <button className="generate-btn" onClick={handleGenerate}>
                <span className="btn-icon">🎨</span>
                生成素材
              </button>
            </div>
          </section>

          {generatedContent && (
            <section className="section">
              <div className="preview-section">
                <div className="preview-header">
                  <h2 className="section-title">
                    <span className="section-icon">👁️</span>
                    朋友圈预览
                  </h2>
                  <div className="action-buttons">
                    <button className="secondary-btn" onClick={handleRegenerate}>
                      🔄 换一个
                    </button>
                    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                      {copied ? '✓ 已复制' : '📋 复制文案'}
                    </button>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="preview-mock">
                    <div className="mock-header">
                      <div className="mock-avatar"></div>
                      <div className="mock-info">
                        <div className="mock-name">你的名字</div>
                        <div className="mock-time">刚刚</div>
                      </div>
                    </div>
                    <div className="mock-content">
                      {generatedContent.text.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <div className="raw-text">
                    <div className="raw-text-header">文案内容</div>
                    <textarea
                      className="raw-textarea"
                      value={generatedContent.text}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Made with ❤️ for 抖音生活服务销售顾问</p>
      </footer>
    </div>
  );
}

export default App;
