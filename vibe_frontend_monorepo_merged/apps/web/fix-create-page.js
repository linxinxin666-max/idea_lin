
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const editPath = path.join(__dirname, 'src/pages/EditAgentCall.tsx');
const createPath = path.join(__dirname, 'src/pages/CreateAgentCall.tsx');

let content = fs.readFileSync(editPath, 'utf8');

// 1. 修改函数名
content = content.replace('function EditAgentCall() {', 'function CreateAgentCall() {');

// 2. 修改导入
content = content.replace("import { useState, useEffect } from 'react';", "import { useState } from 'react';");
content = content.replace("import { IconPlus, IconDelete, IconEdit, IconRobot, IconUser, IconMessage, IconSettings, IconCheckCircle } from '@arco-design/web-react/icon';", "import { IconPlus, IconDelete, IconRobot, IconUser, IconMessage, IconSettings, IconCheckCircle } from '@arco-design/web-react/icon';");
content = content.replace("import { useNavigate, useParams } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';");

// 3. 修改状态
content = content.replace("  const [isFetching, setIsFetching] = useState(false);\n  const [roleConfigCollapsed, setRoleConfigCollapsed] = useState(true);", "  const [roleConfigCollapsed, setRoleConfigCollapsed] = useState(true);");
content = content.replace("  const navigate = useNavigate();\n  const params = useParams<{ id: string }>();\n  const [hasInitialized, setHasInitialized] = useState(false);", "  const navigate = useNavigate();");

// 4. 移除 fetchFlowDetail 和 useEffect
const fetchStart = content.indexOf('  const fetchFlowDetail = async () => {');
const fetchEnd = content.indexOf('  const addCoreContent = () => {');
if (fetchStart !== -1 && fetchEnd !== -1) {
  content = content.slice(0, fetchStart) + content.slice(fetchEnd);
}

// 5. 移除 selectCase 函数
const selectCaseStart = content.indexOf('  const selectCase = (index: number, caseText: string) => {');
const selectCaseEnd = content.indexOf('  const backToInitial = (index: number) => {');
if (selectCaseStart !== -1 && selectCaseEnd !== -1) {
  content = content.slice(0, selectCaseStart) + content.slice(selectCaseEnd);
}

// 6. 修改 handleSubmit
const handleSubmitStart = content.indexOf('  const handleSubmit = async () => {');
const handleSubmitEnd = content.indexOf('  return (');
if (handleSubmitStart !== -1 && handleSubmitEnd !== -1) {
  const originalSubmit = content.slice(handleSubmitStart, handleSubmitEnd);
  const newSubmit = `  const handleSubmit = async () => {
    console.log('提交按钮被点击');
    console.log('formData.name:', formData.name);
    console.log('userInfo:', userInfo);
    
    if (!formData.name) {
      console.log('未填写名称，阻止提交');
      Message.warning('请填写 AgentCall 名称');
      return;
    }

    const currentUserInfo = isLocalhost() 
      ? { email: 'test_user@bytedance.com' } 
      : userInfo;

    if (!currentUserInfo?.email) {
      console.log('无法获取用户信息，阻止提交');
      Message.warning('无法获取用户信息，请重新登录');
      return;
    }

    setIsSubmitting(true);
    
    const peText = buildPeText();
    const agentConfig = buildAgentConfig();
    
    let scriptPe = '';
    try {
      const scriptResponse = await fetch('http://10.71.105.154:8001/self_help/agent_call/gen_script_pe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_call_config: agentConfig
        }),
      });
      
      const scriptResult = await scriptResponse.json();
      if (scriptResult.status_code === 0 && scriptResult.data?.script_pe) {
        scriptPe = scriptResult.data.script_pe;
      }
    } catch (error) {
      console.error('调用 gen_script_pe 接口失败:', error);
    }

    console.log('跳转到对话预览页面...');
    const requestBody = {
      name: formData.name,
      creator: currentUserInfo.email,
      pe_text: peText,
      agent_config: agentConfig,
      isEditMode: false,
      script_pe: scriptPe
    };
    navigate('/self_help/agent_call/chat_page', { state: { formData: requestBody } });
    setIsSubmitting(false);
  };

`;
  content = content.slice(0, handleSubmitStart) + newSubmit + content.slice(handleSubmitEnd);
}

// 7. 修改页面标题
content = content.replace('            <IconEdit style={{ fontSize: \'28px\', color: \'#165DFF\' }} />', '            <IconRobot style={{ fontSize: \'28px\', color: \'#165DFF\' }} />');
content = content.replace('                编辑 AgentCall', '                新建 AgentCall');
content = content.replace('                编辑您的智能外呼机器人配置', '                配置您的智能外呼机器人');

// 8. 移除 Spin 组件
content = content.replace('      <Spin loading={isFetching} style={{ width: \'100%\', display: \'block\' }}>\n        <Card ', '      <Card ');
content = content.replace('        </Card>\n      </Spin>', '        </Card>');

// 9. 修改 export
content = content.replace('export default EditAgentCall;', 'export default CreateAgentCall;');

fs.writeFileSync(createPath, content, 'utf8');
console.log('Successfully updated CreateAgentCall.tsx');
