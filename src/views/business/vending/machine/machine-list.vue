<template>

  <!---------- 查询表单form begin ----------->
  <a-form class="smart-query-form">
    <a-row class="smart-query-form-row" v-privilege="'machine:query'">
      <!-- 模糊查询：机器名称 -->
      <a-form-item label="机器名称" class="smart-query-form-item">
        <a-input style="width: 200px" v-model:value="queryForm.machineName" placeholder="请输入机器名称" allow-clear
          @pressEnter="onSearch" />
      </a-form-item>

      <!-- 精确查询：机器编码 -->
      <a-form-item label="机器编码" class="smart-query-form-item">
        <a-input style="width: 200px" v-model:value="queryForm.machineCode" placeholder="请输入机器编码" allow-clear
          @pressEnter="onSearch" />
      </a-form-item>

      <!-- 状态筛选 -->
      <a-form-item label="机器状态" class="smart-query-form-item">
        <a-select style="width: 150px" v-model:value="queryForm.machineStatus" placeholder="全部状态" allowClear
          @change="onSearch">
          <a-select-option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.desc }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- 操作按钮 -->
      <a-form-item class="smart-query-form-item">
        <a-space>
          <a-button type="primary" @click="onSearch" v-privilege="'machine:query'">
            <template #icon>
              <SearchOutlined />
            </template>
            查询
          </a-button>
          <a-button @click="resetQuery" v-privilege="'machine:query'">
            <template #icon>
              <SyncOutlined />
            </template>
            重置
          </a-button>
        </a-space>
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
    </a-row>
    <!---------- 表格操作行 end ----------->

    <a-table size="small" :dataSource="tableData" :columns="columns" rowKey="machineId"
      :scroll="{ x: 1200, y: yHeight }" bordered :pagination="false" :loading="tableLoading" :showSorterTooltip="false"
      :row-selection="{
        selectedRowKeys: selectedRowKeyList,
        onChange: onSelectChange
      }" @change="onChange" @resizeColumn="handleResizeColumn" :expanded-row-keys="expandedRowKeys"
      @expand="handleExpand">


      <template #bodyCell="{ record, column }">
        <!-- 机器编码 -->
        <template v-if="column.dataIndex === 'machineCode'">
          {{ record.machineCode || '-' }}
        </template>

        <!-- 机器名称 -->
        <template v-else-if="column.dataIndex === 'machineName'">
          {{ record.machineName || '-' }}
        </template>

        <!-- 机器地址 -->
        <template v-else-if="column.dataIndex === 'machineAddress'">
          <a-tooltip :title="record.machineAddress" placement="topLeft">
            <div class="text-ellipsis" style="max-width: 200px">
              {{ record.machineAddress || '-' }}
            </div>
          </a-tooltip>
        </template>

        <!-- 机器状态 -->
        <template v-else-if="column.dataIndex === 'machineStatus'">
          {{ getStatusDesc(record.machineStatus) }}
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.dataIndex === 'action'">
          <div class="smart-table-operate">
            <a-button @click="addMachine(record)" type="link" v-privilege="'machine:update'">编辑</a-button>
            <a-button @click="deleteMachine(record)" danger type="link" v-privilege="'machine:delete'">删除</a-button>
          </div>
        </template>
      </template>
      <!-- 货道子表单 -->
      <template #expandedRowRender="{ record }">
        <MachineAisleNestedTable :machineId="record.machineId" />
      </template>
      
    </a-table>
    <!---------- 表格操作行 end ----------->
    <!---------- 分页 begin ----------->
    <div class="smart-query-table-page">
      <a-pagination showSizeChanger showQuickJumper show-less-items :pageSizeOptions="PAGE_SIZE_OPTIONS"
        :defaultPageSize="queryForm.pageSize" v-model:current="queryForm.pageNum" v-model:pageSize="queryForm.pageSize"
        :total="total" @change="queryData" @showSizeChange="queryData" :show-total="(total) => `共${total}条`" />
    </div>
    <!---------- 分页 end ----------->
  </a-card>

  <!-- 表单弹窗 -->
  <MachineFormModal ref="formModal" @reloadList="queryData" />
</template>

<script setup>
import MachineFormModal from './components/machine-form-modal.vue';
import AisleFormModal from './components/aisle-form-modal.vue';
import MachineAisleNestedTable from './components/machine-aisle-nested-table.vue';
import { onMounted, reactive, ref, computed, h } from 'vue';
import { MACHINE_STATUS_ENUM } from '/@/constants/business/vending/machine-const';
import { message, Modal } from 'ant-design-vue';
import { machineApi } from '/@/api/business/vending/machine-api';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
import { smartSentry } from '/@/lib/smart-sentry'
import _ from 'lodash';


// 表格列定义
const columns = ref([
  {
    title: '机器编码',
    dataIndex: 'machineCode',
    width: 100,
    fixed: 'left',
    resizable: true,//
    required: true,
  },
  {
    title: '机器名称',
    dataIndex: 'machineName',
    resizable: true,
    width: 100,
    required: true,
  }, {
    title: '所属分组',
    dataIndex: 'groupName',
    width: 120,
    ellipsis: true,
    customRender: ({ text }) => text || '-'
  },
  {
    title: '机器型号',
    dataIndex: 'modelName',
    width: 150,
    ellipsis: true
  },
  {
    title: '所属仓库',
    dataIndex: 'warehouseName',
    width: 150,
    ellipsis: true,
    customRender: ({ text }) => text || '-'
  },
  {
    title: '机器地址',
    dataIndex: 'machineAddress',
    width: 200,
    resizable: true,
    ellipsis: true,
    required: true,
  },
  {
    title: '状态',
    dataIndex: 'machineStatus',
    width: 100,
    align: 'center',
    required: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 170,
    align: 'center',
    sorter: true,
    defaultSortOrder: 'descend',
    required: true,
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    width: 170,
    align: 'center',
    sorter: true,
    required: true,
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 150,
    fixed: 'right',
    align: 'center',
  },
]);

// 状态选项
const statusOptions = computed(() => Object.values(MACHINE_STATUS_ENUM).map(item => ({
  value: item.value,
  desc: item.desc,
})));


// 查询表单
const queryForm = reactive({
  machineName: undefined,
  machineCode: undefined,
  groupId: undefined,      // 新增：分组ID
  modelId: undefined,      // 新增：型号ID
  warehouseId: undefined,  // 新增：仓库ID
  machineStatus: undefined,
  pageNum: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
});

// 表格数据
const tableData = ref([]);
const total = ref(0);
const tableLoading = ref(false);
const selectedRowKeyList = ref([]);
const formModal = ref();

// 用于存储当前展开行的 key
const expandedRowKeys = ref([]);

// ---------------------------- 数据查询 ----------------------------

/**
 * 查询数据
 */
async function queryData() {
  try {
    tableLoading.value = true;
    const params = { ...queryForm };

    // 处理排序
    if (params.sortField) {
      params.sortField = _.camelCase(params.sortField);
      params.sortOrder = params.sortOrder === 'ascend' ? 'asc' : 'desc';
    }

    const { data } = await machineApi.queryMachineList(params);
    tableData.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    smartSentry.captureError(error);
    message.error('查询失败');
  } finally {
    console.log(queryForm);
    tableLoading.value = false;

  }
}

/**
 * 搜索
 */
function onSearch() {
  queryForm.pageNum = 1;
  queryData();
}

/**
 * 重置查询
 */
function resetQuery() {
  Object.assign(queryForm, {
    machineName: undefined,
    machineCode: undefined,
    groupId: undefined,
    modelId: undefined,
    warehouseId: undefined,
    machineStatus: undefined,
    pageNum: 1,
    sortField: 'createTime',
    sortOrder: 'descend',
  });
  queryData();
}

/**
 * 表格排序变化
 */
function onChange(pagination, filters, sorter) {
  if (sorter.field) {
    queryForm.sortField = sorter.field;
    queryForm.sortOrder = sorter.order;
  } else {
    queryForm.sortField = 'createTime';
    queryForm.sortOrder = 'descend';
  }
  queryData();
}

/**
 * 处理列宽调整
 */
function handleResizeColumn(w, col) {
  col.width = w;
}

// ---------------------------- 添加/修改 ----------------------------

/**
 * 添加/编辑机器
 */
function addMachine(record) {
  formModal.value.showDrawer(record);
  console.log(record);
}

// ---------------------------- 删除 ----------------------------

/**
 * 单个删除
 */
async function deleteMachine(record) {
  try {
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
          smartSentry.captureError(error);
          message.error('删除失败');
        } finally {
          SmartLoading.hide();
        }
      },
    });
  } catch (error) {
    smartSentry.captureError(error);
    message.error('删除失败');
  }
}

// ---------------------------- 批量删除 ----------------------------

/**
 * 选择行变化
 */
function onSelectChange(selectedRowKeys) {
  selectedRowKeyList.value = selectedRowKeys;
}

/**
 * 确认批量删除
 */
function confirmBatchDelete() {
  if (selectedRowKeyList.value.length === 0) {
    message.warning('请选择要删除的机器');
    return;
  }

  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedRowKeyList.value.length} 台机器吗？`,
    onOk: batchDelete,
  });
}

/**
 * 执行批量删除
 */
async function batchDelete() {
  try {
    SmartLoading.show();
    await machineApi.batchDelete(selectedRowKeyList.value);
    message.success('批量删除成功');
    selectedRowKeyList.value = [];
    queryData();
  } catch (error) {
    smartSentry.captureError(error);
    message.error('批量删除失败');
  } finally {
    SmartLoading.hide();
  }
}

const handleExpand = (expanded, record) => {
  if (expanded) {
    expandedRowKeys.value = [record.machineId]; // 只保留当前展开的 key
  } else {
    expandedRowKeys.value = []; // 折叠时清空
  }
};


// 页面加载时查询数据
onMounted(() => {
  queryData();
  console.log(tableData.value);
});

// 获取状态描述
function getStatusDesc(status) {
  const statusItem = Object.values(MACHINE_STATUS_ENUM).find(item => item.value === status);
  return statusItem?.desc || '未知';
}
</script>

<style scoped>
.a-card {
  display: flex;
  flex-direction: column;
  height: 100%; /* 假设 a-card 的父容器有确定的高度 */
}

:deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* 让 card-body 占据所有剩余空间 */
  overflow: hidden; /* 防止内部元素溢出 */
}

.a-table {
  flex-grow: 1; /* 让 a-table 占据 card-body 内的所有剩余空间 */
  overflow: auto; /* 表格内容超出时，表格自身出现滚动条 */
}
</style>