<!--
  * 机器列表
-->
<template>
    <!---------- 查询表单form begin ----------->
    <a-form class="smart-query-form">
      <a-row class="smart-query-form-row" v-privilege="'machine:query'">
        <a-form-item label="机器名称" class="smart-query-form-item">
                <a-input style="width: 200px" v-model:value="queryForm.machineName" placeholder="请输入机器名称"
                    @pressEnter="onSearch" />
        </a-form-item>
  
        <a-form-item label="机器编码" class="smart-query-form-item">
                <a-input style="width: 150px" v-model:value="queryForm.machineCode" placeholder="请输入机器编码"
                    @pressEnter="onSearch" />
        </a-form-item>

        <a-form-item label="机器状态" class="smart-query-form-item">
          <a-select 
            style="width: 150px" 
            v-model:value="queryForm.machineStatus" 
            placeholder="请选择状态"
            allowClear
            @change="onSearch"
          >
            <a-select-option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.desc }}
            </a-select-option>
          </a-select>
        </a-form-item>
  
        <a-form-item class="smart-query-form-item">
          <a-button-group>
            <a-button type="primary" @click="onSearch" v-privilege="'machine:query'">
              <template #icon>
                <SearchOutlined />
              </template>
              查询
            </a-button>
            <a-button @click="resetQuery" v-privilege="'machine:query'">
              <template #icon>
                <ReloadOutlined />
              </template>
              重置
            </a-button>
          </a-button-group>
        </a-form-item>
      </a-row>
    </a-form>
    <!---------- 查询表单form end ----------->
  
    <a-card size="small" :bordered="false" :hoverable="true">
      <!---------- 表格操作行 begin ----------->
      <a-row class="smart-table-btn-block">
        <div class="smart-table-operate-block">
          <a-button @click="addMachine()" type="primary" v-privilege="'machine:add'">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
  
                <a-button @click="confirmBatchDelete" danger :disabled="selectedRowKeyList.length === 0"
                    v-privilege="'machine:batchDelete'">
            <template #icon>
              <DeleteOutlined />
            </template>
            批量删除
          </a-button>
        </div>
        <div class="smart-table-setting-block">
          <TableOperator v-model="columns" :tableId="TABLE_ID_CONST.BUSINESS.ERP.MACHINE" :refresh="queryData" />
        </div>
      </a-row>
      <!---------- 表格操作行 end ----------->
      <a-table
        size="small"
        :dataSource="tableData"
        :columns="columns"
        rowKey="machineId"
        :scroll="{ x: 1200, y: yHeight }"
        bordered
        :pagination="false"
        :loading="tableLoading"
        :showSorterTooltip="false"
        :row-selection="{ selectedRowKeys: selectedRowKeyList, onChange: onSelectChange }"
        @change="onChange"
        @resizeColumn="handleResizeColumn"
      >
        <template #headerCell="{ column }">
                <SmartHeaderCell v-model:value="queryForm[column.filterOptions?.key || column.dataIndex]"
                    :column="column" @change="queryData" />
        </template>
  
        <template #bodyCell="{ record, column }">
          <!-- 状态列 -->
          <template v-if="column.dataIndex === 'machineStatus'">
            <a-tag :color="getStatusColor(record.machineStatus)">
              {{ getStatusDesc(record.machineStatus) }}
            </a-tag>
          </template>
          
          <!-- 操作列 -->
          <template v-else-if="column.dataIndex === 'action'">
            <div class="smart-table-operate">
              <a-button @click="addMachine(record)" type="link" v-privilege="'machine:update'">编辑</a-button>
                        <a-button @click="deleteMachine(record)" danger type="link"
                            v-privilege="'machine:delete'">删除</a-button>
            </div>
          </template>
        </template>
      </a-table>
  
      <div class="smart-query-table-page">
        <a-pagination
          showSizeChanger
          showQuickJumper
          show-less-items
          :pageSizeOptions="PAGE_SIZE_OPTIONS"
          :defaultPageSize="queryForm.pageSize"
          v-model:current="queryForm.pageNum"
          v-model:pageSize="queryForm.pageSize"
          :total="total"
          @change="queryData"
          @showSizeChange="queryData"
          :show-total="(total) => `共${total}条`"
        />
      </div>
    </a-card>
  </template>
  
  <script setup>
  import { machineApi } from '/@/api/business/machine/machine-api';
  import MachineFormModal from './components/machine-form-modal.vue';
    import { onMounted, reactive, ref } from 'vue';
  import { message, Modal } from 'ant-design-vue';
  import { SmartLoading } from '/@/components/framework/smart-loading';
    import { PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
  import { smartSentry } from '/@/lib/smart-sentry';
  import { useTableHeight } from '/@/hooks/use-table-height';
  import { TABLE_ID_CONST } from '/@/constants/smart-table';
  import _ from 'lodash';
    import SmartHeaderCell from '/@/components/support/table-header-cell/index.vue';
  
  // 表格列定义
  const columns = ref([
    {
      title: '机器编码',
      dataIndex: 'machineCode',
      width: 100,
      fixed: 'left',
      filterOptions: {
        key: 'machineCode',
      },
    },
    {
      title: '机器名称',
      dataIndex: 'machineName',
        resizable: true,
        width: 100,
      filterOptions: {
          type: 'input',
        key: 'machineName',
      },
    },
    {
      title: '机器地址',
      dataIndex: 'machineAddress',
      width: 200,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'machineStatus',
      width: 100,
      filterOptions: {
        key: 'machineStatus',
        filterOptions: statusOptions.map(item => ({
          text: item.desc,
          value: item.value,
        })),
      },
    },
    
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
      sorter: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 170,
      sorter: true,
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 120,
      fixed: 'right',
    },
  ]);
  
  // 分页配置
  const PAGE_SIZE_OPTIONS = ['10', '20', '30', '50', '100'];
  
  // 查询表单
  const queryForm = reactive({
    machineName: undefined,
    machineCode: undefined,
    machineStatus: undefined,
    pageNum: 1,
    pageSize: 10,
    sortField: 'createTime',
    sortOrder: 'descend',
  });
  
    // 表格加载loading

  // 表格数据
  const tableData = ref([]);
    // 总数
  const total = ref(0);
  const tableLoading = ref(false);
  
  // 动态高度
  const { yHeight } = useTableHeight(180);
  
  // 查询数据
  const queryData = async () => {
    try {
      tableLoading.value = true;
      const params = { ...queryForm };
      
      // 处理排序
      if (params.sortField) {
        params.sortField = _.snakeCase(params.sortField);
      }
      
      const res = await machineApi.queryMachineList(params);
      tableData.value = res.data.list || [];
      total.value = res.data.total || 0;
    } catch (error) {
      console.error('查询失败:', error);
      smartSentry.captureError(error);
    } finally {
      tableLoading.value = false;
    }
  };
  
  // 搜索
  const onSearch = () => {
    queryForm.pageNum = 1;
    queryData();
  };
  
  // 重置查询
  const resetQuery = () => {
    Object.assign(queryForm, {
      machineName: undefined,
      machineCode: undefined,
      machineStatus: undefined,
      pageNum: 1,
      sortField: 'createTime',
      sortOrder: 'descend',
    });
    queryData();
  };
  
  // 表格排序变化
  const onChange = (pagination, filters, sorter) => {
    if (sorter.order) {
      queryForm.sortField = sorter.field;
      queryForm.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    } else {
      queryForm.sortField = 'createTime';
      queryForm.sortOrder = 'descend';
    }
    queryData();
  };
  
  // 处理列宽调整
  const handleResizeColumn = (w, col) => {
    col.width = w;
  };
  
  // ---------------------------- 添加/修改 ----------------------------
  const formModal = ref();
  
  // 添加/编辑机器
  const addMachine = (record) => {
    formModal.value.showDrawer(record);
  };
  
  // ---------------------------- 删除 ----------------------------
  
  // 单个删除
  const deleteMachine = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除机器【${record.machineName}】吗？`,
      onOk: async () => {
        try {
          SmartLoading.show();
          await machineApi.deleteMachine(record.machineId);
          message.success('删除成功');
          queryData();
        } catch (error) {
          console.error('删除失败:', error);
          smartSentry.captureError(error);
        } finally {
          SmartLoading.hide();
        }
      },
    });
  };
  
  // ---------------------------- 批量删除 ----------------------------
  
  const selectedRowKeyList = ref([]);
  
  // 选择行变化
  const onSelectChange = (selectedRowKeys) => {
    selectedRowKeyList.value = selectedRowKeys;
  };
  
  // 确认批量删除
  const confirmBatchDelete = () => {
    if (selectedRowKeyList.value.length === 0) {
      message.warning('请至少选择一条数据');
      return;
    }
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的${selectedRowKeyList.value.length}条数据吗？`,
      onOk: batchDelete,
    });
  };
  
  // 执行批量删除
  const batchDelete = async () => {
    try {
      SmartLoading.show();
      await machineApi.batchDelete(selectedRowKeyList.value);
      message.success('批量删除成功');
      selectedRowKeyList.value = [];
      queryData();
    } catch (error) {
      console.error('批量删除失败:', error);
      smartSentry.captureError(error);
    } finally {
      SmartLoading.hide();
    }
  };
  
  // 页面加载时查询数据
  onMounted(() => {
    queryData();
  });
  
  // 监听窗口大小变化，重新计算表格高度
  window.addEventListener('resize', _.throttle(() => {
    yHeight.value = window.innerHeight - 300;
  }, 300));
  </script>
  
  <style scoped></style>