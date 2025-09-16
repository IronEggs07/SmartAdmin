<!--
  * 机器列表
  *
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-07-21 21:55:12
  * @Wechat:    zhuda1024
  * @Email:     lab1024@163.com
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
-->
<template>
  <!---------- 查询表单form begin ----------->
  <a-form class="smart-query-form">
    <a-row class="smart-query-form-row" v-privilege="'machine:query'">
      <a-form-item label="机器名称" class="smart-query-form-item">
        <a-input style="width: 200px" v-model:value="queryForm.machineName" placeholder="请输入机器名称" @pressEnter="onSearch" />
      </a-form-item>

      <a-form-item label="机器编码" class="smart-query-form-item">
        <a-input style="width: 150px" v-model:value="queryForm.machineCode" placeholder="请输入机器编码" @pressEnter="onSearch" />
      </a-form-item>

      <a-form-item label="机器状态" class="smart-query-form-item">
        <a-select style="width: 150px" v-model:value="queryForm.machineStatus" placeholder="请选择状态" allowClear @change="onSearch">
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

        <a-button @click="confirmBatchDelete" danger :disabled="selectedRowKeyList.length === 0" v-privilege="'machine:batchDelete'">
          <template #icon>
            <DeleteOutlined />
          </template>
          批量删除
        </a-button>
      </div>
      <div class="smart-table-setting-block">
        <TableOperator v-model="columns" :tableId="TABLE_ID_CONST.BUSINESS.VENDING.MACHINE" :refresh="queryData" />
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
        <SmartHeaderCell 
          v-model:value="queryForm[column.filterOptions?.key || column.dataIndex]" 
          :column="column" 
          @change="queryData" 
        />
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
            <a-button @click="deleteMachine(record)" danger type="link" v-privilege="'machine:delete'">删除</a-button>
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

  <!-- 表单弹窗 -->
  <MachineFormModal ref="formModal" @reloadList="queryData" />
</template>

<script setup>
import MachineFormModal from './components/machine-form-modal.vue';
import { onMounted, reactive, ref, computed } from 'vue';
import { MACHINE_STATUS_ENUM } from '/@/constants/business/vending/machine-const';
import { message, Modal } from 'ant-design-vue';
import { machineApi } from '/@/api/business/vending/machine-api';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
import { smartSentry } from '/@/lib/smart-sentry';
import { TABLE_ID_CONST } from '/@/constants/support/table-id-const';
import _ from 'lodash';
import SmartHeaderCell from '/@/components/support/table-header-cell/index.vue';
import TableOperator from '/@/components/support/table-operator/index.vue';
// import { useTableHeight } from '/@/hooks/use-table-height';

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
    // filterOptions: {
    //   key: 'machineStatus',
    //   filterOptions: computed(() => 
    //     statusOptions.value.map(item => ({
    //       text: item.desc,
    //       value: item.value,
    //     }))
    //   ),
    // },
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

// 状态选项
const statusOptions = computed(() => Object.values(MACHINE_STATUS_ENUM).map(item => ({
  value: item.value,
  desc: item.desc,
})));

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

// 表格数据
const tableData = ref([]);
const total = ref(0);
const tableLoading = ref(false);
const selectedRowKeyList = ref([]);
const formModal = ref();

// 动态高度
// const { yHeight } = useTableHeight(180);
// 动态设置表格高度
const yHeight = ref(0);
onMounted(() => {
  resetGetHeight();
});
function resetGetHeight() {
  // 搜索部分高度
  let doc = document.querySelector('.ant-form');
  // 按钮部分高度
  let btn = document.querySelector('.smart-table-btn-block');
  // 表格头高度
  let tableCell = document.querySelector('.ant-table-cell');
  // 分页高度
  let page = document.querySelector('.smart-query-table-page');
  // 内容区总高度
  let box = document.querySelector('.admin-content');
  setTimeout(() => {
    let dueHeight = doc.offsetHeight + 10 + 24 + btn.offsetHeight + 15 + tableCell.offsetHeight + page.offsetHeight + 20;
    yHeight.value = box.offsetHeight - dueHeight;
  }, 100);
}

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

// 页面加载时查询数据
onMounted(() => {
  queryData();
});

// 获取状态描述
function getStatusDesc(status) {
  const statusItem = Object.values(MACHINE_STATUS_ENUM).find(item => item.value === status);
  return statusItem?.desc || '未知';
}

// 获取状态颜色
function getStatusColor(status) {
  const statusColorMap = {
    [MACHINE_STATUS_ENUM.NORMAL.value]: 'green',
    [MACHINE_STATUS_ENUM.FAULT.value]: 'orange',
    [MACHINE_STATUS_ENUM.OFFLINE.value]: 'red',
  };
  return statusColorMap[status] || 'default';
}
</script>

<style scoped>
:deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>