import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button, Pagination, Empty, Spin, Toast } from '@douyinfe/semi-ui';
import { IconSearch, IconRefresh, IconPlus } from '@douyinfe/semi-icons';
import { ScriptCard } from '../../components/ScriptCard/ScriptCard';
import type { FlowItem } from '../../types/script';
import { BACKEND_AUTHORIZATION } from '../../utils/constants';
import './ScriptList.css';

const sortOptions = [
  { value: 'newest', label: '最新创建' },
  { value: 'oldest', label: '最早创建' },
];

export function ScriptList() {
  const navigate = useNavigate();
  
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchScripts = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/get_flow_list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: BACKEND_AUTHORIZATION,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.status_code === 0) {
        setFlows(data.data.flow_list);
      } else {
        Toast.error('获取列表失败: ' + data.msg);
        setFlows([]);
      }
    } catch {
      Toast.error('获取列表失败');
      setFlows([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const filteredScripts = useMemo(() => {
    let result = [...flows];
    
    if (searchText) {
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.add_time).getTime() - new Date(a.add_time).getTime();
        case 'oldest':
          return new Date(a.add_time).getTime() - new Date(b.add_time).getTime();
        default:
          return 0;
      }
    });
    
    return result;
  }, [flows, searchText, sortBy]);

  const paginatedScripts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredScripts.slice(start, start + pageSize);
  }, [filteredScripts, currentPage]);

  const handleEdit = (id: number) => {
    navigate(`/self_help/agent_call/edit/${id}`);
  };

  const handleCopy = async (id: number) => {
    Toast.success('复制成功');
  };

  const handleViewData = (id: number) => {
    navigate(`/self_help/agent_call/data/${id}`);
  };

  const handleDelete = async (id: number) => {
    Toast.success('删除成功');
    fetchScripts();
  };

  return (
    <div className="script-list">
      <div className="list-header">
        <h2 className="page-title">剧本管理</h2>
        {!loading && flows.length > 0 && (
          <span className="page-count">{filteredScripts.length} 个剧本</span>
        )}
      </div>

      <div className="toolbar">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索剧本名称..."
          value={searchText}
          onChange={setSearchText}
          style={{ width: 220 }}
        />
        <Select
          value={sortBy}
          onChange={(v) => setSortBy(String(v ?? 'newest'))}
          style={{ width: 120 }}
        >
          {sortOptions.map(opt => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
        <div className="toolbar-right">
          <Button icon={<IconRefresh />} onClick={fetchScripts}>刷新</Button>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => navigate('/self_help/agent_call/create')}
          >
            新建剧本
          </Button>
        </div>
      </div>
      
      <div className="list-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : paginatedScripts.length === 0 ? (
          <Empty
            title="还没有剧本"
            description="去创建第一个剧本吧"
            style={{ padding: '60px 0' }}
          />
        ) : (
          <>
            <div className="card-list">
              {paginatedScripts.map(flow => (
                <ScriptCard
                  key={flow.id}
                  flow={flow}
                  onEdit={handleEdit}
                  onCopy={handleCopy}
                  onViewData={handleViewData}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            
            <div className="pagination-wrapper">
              <Pagination
                total={filteredScripts.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
