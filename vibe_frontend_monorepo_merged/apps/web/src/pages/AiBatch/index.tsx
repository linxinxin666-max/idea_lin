import React, { useState } from 'react';
import {
  Layout,
  ResizeBox,
  Tabs,
  Input,
  Button,
  Table,
  Upload,
  Message,
  Typography,
} from '@arco-design/web-react';
import axios from 'axios';
import '@arco-design/web-react/dist/css/arco.css';

const { TextArea } = Input;
const { TabPane } = Tabs;

const API_PREFIX = "https://dupe.bytedance.net/self_help";
const API_HEADERS = {};

const AiBatch: React.FC = () => {
  const [promptInputValue, setPromptInputValue] = useState("");
  
  const [testInputValue, setTestInputValue] = useState("");
  const [testOutputQuestionValue, setTestOutputQuestionValue] = useState("");
  const [testOutputAnswerValue, setTestOutputAnswerValue] = useState("");
  
  const [batchInputValue, setBatchInputValue] = useState("");
  const [batchOutputValue, setBatchOutputValue] = useState<any[]>([]);
  
  const [taskNameValue, setTaskNameValue] = useState("");
  const [operatorValue, setOperatorValue] = useState("");
  // const [taskId, setTaskId] = useState(""); // taskId unused, removed to fix build error
  const taskId = ""; 
  
  const [queryFlag, setQueryFlag] = useState(false);

  const batchOutputColumn = [
    {
      title: '问题',
      dataIndex: 'question',
    },
    {
      title: '答案',
      dataIndex: 'answer',
    },
  ];

  const handleTestQuery = () => {
    if (queryFlag) {
      Message.warning("查询进行中～请稍等");
      return;
    }

    setQueryFlag(true);
    Message.info("已提交，请稍等～");

    const data = {
      question: testInputValue,
      prompt: promptInputValue,
      bot_type: "1",
    };

    axios({
      method: "post",
      url: API_PREFIX + "/api/ai_batch_single_chat",
      data: data,
      headers: API_HEADERS,
    }).then((response) => {
      setQueryFlag(false);
      if (response.data.status_code === 0) {
        setTestOutputQuestionValue(testInputValue);
        setTestOutputAnswerValue(response.data.data);
      } else {
        Message.error(`查询失败: ${response.data.message || '未知错误'}`);
      }
    }).catch((err) => {
      setQueryFlag(false);
      Message.error("请求发生错误");
      console.error(err);
    });
  };

  const handleBatchQuery = async () => {
    if (queryFlag) {
      Message.warning("查询进行中～请稍等");
      return;
    }

    setQueryFlag(true);
    Message.info("已提交，请稍等～");
    setBatchOutputValue([]);

    const questions = batchInputValue.split("\n").filter(q => q.trim());
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const data = {
        question: question,
        prompt: promptInputValue,
        bot_type: "1",
      };

      try {
        const response = await axios({
          method: "post",
          url: API_PREFIX + "/api/ai_batch_single_chat",
          data: data,
          headers: API_HEADERS,
        });

        if (response.data.status_code === 0) {
          setBatchOutputValue(prev => [...prev, {
             question: question,
             answer: response.data.data
          }]);
        }
      } catch (err) {
        console.error(err);
      }
    }

    setQueryFlag(false);
  };

  const getFileUploadData = () => {
    return {
      task_name: taskNameValue,
      operator: operatorValue,
      prompt: promptInputValue,
      bot_type: "1",
    };
  };

  const uploadTip = () => {
    Message.info("已上传，任务完成之后会有机器人推送～");
  };

  return (
    <Layout style={{ height: '100vh', width: '95vw', margin: 'auto', background: 'var(--color-fill-2)', border: '1px solid var(--color-border)' }}>
      <div style={{ padding: '10px', height: '100%' }}>
        <Typography.Paragraph style={{ fontSize: '20px', marginLeft: '10px' }}>
          AI能力批量调用工具，联系人@王俊杰，使用手册：
          <a href="https://bytedance.larkoffice.com/docx/UCvDdLcvloZfmmxU9yVc7L3UnCg" target="_blank" rel="noopener noreferrer">
            【操作手册】AI批量调用工具
          </a>
        </Typography.Paragraph>

        <div style={{ height: 'calc(100vh - 80px)', border: '1px solid var(--color-border)', display: 'flex' }}>
          <ResizeBox.Split
            direction="horizontal"
            style={{ height: '100%', width: '100%' }}
            size={0.5}
            min={200}
            panes={[
              <div key="left" style={{ padding: '16px', height: '100%', overflow: 'auto', background: '#f5f5f5' }}>
                <h3 style={{ marginBottom: '12px' }}>Prompt 配置</h3>
                <p style={{ color: '#666', marginBottom: '8px' }}>请在下面的输入框直接输入Prompt，后台模型为豆包</p>
                <TextArea
                  placeholder="在此输入Prompt"
                  value={promptInputValue}
                  onChange={setPromptInputValue}
                  style={{ background: 'white', width: '100%', minHeight: '300px' }}
                />
              </div>,
              <div key="right" style={{ padding: '16px', height: '100%', overflow: 'auto', background: '#f5f5f5' }}>
                <Tabs defaultActiveTab="test">
                  <TabPane key="test" title="调试模式">
                    <p style={{ marginLeft: '2px' }}>输入请求内容，确认完之后点击按钮，视请求大小等待十秒～一分钟</p>
                    <TextArea
                      placeholder="在此输入问题"
                      value={testInputValue}
                      onChange={setTestInputValue}
                      style={{ background: 'white', width: '100%', minHeight: '100px' }}
                    />
                    <div style={{ marginTop: '10px' }}>
                      <Button type="primary" onClick={handleTestQuery}>查询</Button>
                    </div>

                    <p style={{ marginTop: '16px' }}>以下为AI输出结果：</p>
                    <p>问题：{testOutputQuestionValue}</p>
                    <p style={{ width: '90%' }}>答案：{testOutputAnswerValue}</p>
                  </TabPane>
                  <TabPane key="batch" title="输入模式">
                    <p>可在页面上直接输入批量的问题，通过换行分割</p>
                    <TextArea
                      placeholder="请输入问题列表"
                      value={batchInputValue}
                      onChange={setBatchInputValue}
                      style={{ background: 'white', width: '100%', minHeight: '200px' }}
                    />
                    <div style={{ marginTop: '10px' }}>
                      <Button type="primary" onClick={handleBatchQuery}>查询</Button>
                    </div>

                    <p style={{ marginTop: '16px' }}>以下为AI输出结果：</p>
                    <Table
                      columns={batchOutputColumn}
                      data={batchOutputValue}
                      pagination={false}
                    />
                  </TabPane>
                  <TabPane key="file_upload" title="文件上传">
                    <p>请上传包含问题列表的Excel文件，读取A列，第二行开始</p>
                    <p>请输入任务名称，用于后续追溯任务详情</p>
                    <Input
                      placeholder="在此输入任务名称"
                      value={taskNameValue}
                      onChange={setTaskNameValue}
                      style={{ background: 'white', width: '100%' }}
                      allowClear
                    />
                    <p />
                    <p>请输入操作人邮箱，用于发送完成通知，例如「wangjunjie.09@bytedance.com」</p>
                    <Input
                      placeholder="在此输入操作人邮箱"
                      value={operatorValue}
                      onChange={setOperatorValue}
                      style={{ background: 'white', width: '100%' }}
                      allowClear
                    />

                    <p />
                    <p>任务ID:{taskId}</p>
                    <Upload
                      action="https://dupe.bytedance.net/self_help/api/ai_batch_task_create"
                      data={getFileUploadData}
                      onChange={(_, file) => {
                        if (file.status === 'done') {
                            uploadTip();
                        }
                      }}
                      headers={API_HEADERS}
                    />
                  </TabPane>
                </Tabs>
              </div>
            ]}
          />
        </div>
      </div>
    </Layout>
  );
};

export default AiBatch;
