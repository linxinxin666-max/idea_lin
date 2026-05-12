import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Input,
  Table,
  Modal,
  Form,
  Toast,
  Empty,
  Spin,
} from '@douyinfe/semi-ui';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { IconPlus, IconSearch, IconRefresh } from '@douyinfe/semi-icons';
import { useAppStore } from '../../stores/useAppStore';
import { useKBStore } from '../../stores/useKBStore';
import * as kbService from '../../services/knowledgeService';
import type { KnowledgeBase, KnowledgeTheme } from '../../types/knowledge';
import type { BusinessAction } from '../../types/script';
import './KBList.css';

function convertKnowledgeThemeToKB(theme: KnowledgeTheme): KnowledgeBase {
  return {
    id: theme.theme_id,
    name: theme.theme_name,
    businessActions: [] as BusinessAction[],
    description: theme.theme_desc,
    itemCount: theme.theme_docs_cnt,
    createdBy: theme.theme_creator,
    createdAt: theme.create_time,
    updatedAt: theme.update_time,
  };
}

const { Text } = Typography;

const businessActionOptions: BusinessAction[] = [
  '新开', '上品', '促三品', '发文', '开播', '商品优化',
  '达人合作', '活动报名', '店铺装修', '评价管理', '客服配置',
  '物流优化', '数据分析', '广告投放', '会员运营', '售后处理',
  '团购配置', '权益开通',
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

interface CreateFormValues {
  businessAction: string;
  description?: string;
}

export function KBList() {
  const navigate = useNavigate();
  const { useMockData } = useAppStore();
  const formApi = useRef<{ validate: () => Promise<CreateFormValues> } | null>(null);

  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = async (params?: { page?: number; keyword?: string }) => {
    const p = params?.page ?? page;
    const kw = params?.keyword ?? keyword;

    setLoading(true);
    try {
      const res = await kbService.getAllKnowledgeTheme();
      if (res.data.status_code === 0) {
        let list = res.data.data.map(convertKnowledgeThemeToKB);
        if (kw) list = list.filter((kb) => kb.name.includes(kw));
        setTotal(list.length);
        setKbs(list.slice((p - 1) * pageSize, p * pageSize));
      } else {
        Toast.error('获取知识库列表失败: ' + (res.data.msg || '未知错误'));
      }
    } catch {
      Toast.error('获取知识库列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchList({ page: 1 });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchList({ page: p });
  };

  const handleDelete = async (id: string) => {
    try {
      await kbService.deleteKnowledgeTheme(id);
      Toast.success('删除成功');
      fetchList();
    } catch {
      Toast.error('删除失败');
    }
  };

  const handleCreate = async () => {
    if (!formApi.current) return;
    try {
      const values = await formApi.current.validate();

      const scene = values.businessAction.trim();
      const existingScenes = new Set(kbs.map((kb) => kb.name));
      if (existingScenes.has(scene)) {
        Toast.error(`活动场景"${scene}"已被其他知识库使用`);
        return;
      }

      setCreating(true);
      let newId = 'kb-new';
      if (useMockData) {
        await new Promise((r) => setTimeout(r, 300));
        newId = `kb-${Date.now()}`;
        const now = new Date().toISOString();
        useKBStore.setState({
          currentKB: {
            id: newId,
            name: scene,
            businessActions: [scene as BusinessAction],
            itemCount: 0,
            createdBy: '我',
            createdAt: now,
            updatedAt: now,
          },
          items: [],
          editLoading: false,
        });
        Toast.success('创建成功');
      } else {
        const res = await kbService.createKB({ name: scene, businessActions: [scene as BusinessAction] });
        newId = res.data.id;
        Toast.success('创建成功');
      }
      setCreateVisible(false);
      navigate(`/self_help/agent_call/knowledge/edit/${newId}`);
    } catch {
      // form validation error or API error — do nothing
    } finally {
      setCreating(false);
    }
  };

  const columns: ColumnProps<KnowledgeBase>[] = [
    {
      title: '活动场景',
      dataIndex: 'name',
      width: 150,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '场景描述',
      dataIndex: 'description',
      width: 300,
      render: (text: string) => <Text type="tertiary">{text || '-'}</Text>,
    },
    {
      title: '条目数',
      dataIndex: 'itemCount',
      width: 100,
      sorter: (a: KnowledgeBase, b: KnowledgeBase) => a.itemCount - b.itemCount,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      sorter: (a: KnowledgeBase, b: KnowledgeBase) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (t: string) => formatDate(t),
    },
    {
      title: '操作',
      width: 140,
      align: 'center' as const,
      render: (_: unknown, record: KnowledgeBase) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button
            size="small"
            style={{ background: '#f0f5ff', color: '#3370ff', border: '1px solid #c9d8ff', borderRadius: 7 }}
            onClick={() => navigate(`/self_help/agent_call/knowledge/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            size="small"
            style={{ background: '#fff1f0', color: '#cb2a2a', border: '1px solid #ffcdd2', borderRadius: 7 }}
            onClick={() => setDeletingId(record.id)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="kb-list-page">
      <div className="kb-list-page-header">
        <h2 className="kb-list-page-title">知识库管理</h2>
        {!loading && total > 0 && (
          <span className="kb-list-page-count">{total} 个知识库</span>
        )}
        <div className="kb-list-page-actions">
          <Button type="primary" icon={<IconPlus />} onClick={() => setCreateVisible(true)}>
            新建知识库
          </Button>
        </div>
      </div>

      <div className="kb-list-toolbar">
        <Input
          className="kb-list-search-input"
          prefix={<IconSearch />}
          placeholder="搜索活动场景名称..."
          value={keyword}
          onChange={setKeyword}
          onEnterPress={handleSearch}
        />
        <Button icon={<IconRefresh />} onClick={() => fetchList()}>刷新</Button>
      </div>

      {loading ? (
        <div className="kb-list-loading-wrap">
          <Spin size="large" />
        </div>
      ) : kbs.length === 0 ? (
        <Empty description="还没有知识库，点击右上角新建" style={{ padding: '60px 0' }} />
      ) : (
        <Table
          columns={columns}
          dataSource={kbs}
          rowKey="id"
          pagination={{
            currentPage: page,
            pageSize,
            total,
            onPageChange: handlePageChange,
          }}
        />
      )}

      <Modal
        title="新建知识库"
        visible={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okButtonProps={{ loading: creating }}
        okText="创建并编辑"
      >
        <Form
          getFormApi={(api) => {
            formApi.current = api as unknown as { validate: () => Promise<CreateFormValues> };
          }}
          layout="vertical"
        >
          <Form.Input
            field="businessAction"
            label="活动场景"
            placeholder="请输入活动场景名称"
            rules={[{ required: true, message: '请输入活动场景名称' }]}
          />
          <Form.TextArea
            field="description"
            label="场景描述"
            placeholder="请输入场景描述（选填）"
            autosize={{ minRows: 2, maxRows: 4 }}
          />
        </Form>
      </Modal>

      <Modal
        title="确定删除该知识库？"
        visible={deletingId !== null}
        onOk={async () => {
          if (deletingId) await handleDelete(deletingId);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
        okText="确定"
        cancelText="取消"
        okType="danger"
        centered
      >
        删除后不可恢复。
      </Modal>
    </div>
  );
}
