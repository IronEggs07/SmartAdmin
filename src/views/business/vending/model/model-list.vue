<!--
  * 机器型号列表
-->
<template>
  <!---------- 查询表单form begin ----------->
  <a-form class="smart-query-form">
    <a-row class="smart-query-form-row" v-privilege="'model:query'">
      <a-form-item label="型号名称" class="smart-query-form-item">
        <a-input style="width: 200px" v-model:value="queryForm.modelName" placeholder="请输入型号名称"
          @pressEnter="onSearch" />
      </a-form-item>

      <a-form-item class="smart-query-form-item">
        <a-button-group>
          <a-button type="primary" @click="onSearch" v-privilege="'model:query'">
            <template #icon>
              <StarOutlined />
            </template>
            查询
          </a-button>
          <a-button @click="resetQuery" v-privilege="'model:query'">
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
        <a-button @click="addModel()" type="primary" v-privilege="'model:add'">
          <template #icon>
            <PlusOutlined />
          </template>
          新建
        </a-button>

        <a-button @click="confirmBatchDelete" danger :disabled="selectedRowKeyList.length === 0"
          v-privilege="'model:batchDelete'">
          <template #icon>
            <DeleteOutlined />
          </template>
          批量删除
        </a-button>
        
        <!-- <a-button @click="showImportModal" type="primary" v-privilege="'model:import'">
          <template #icon>
            <ImportOutlined />
          </template>
          导入
        </a-button>

        <a-button @click="onExportModel" type="primary" v-privilege="'model:export'">
          <template #icon>
            <ExportOutlined />
          </template>
          导出
        </a-button> -->


      </div>
    </a-row>
    <!---------- 表格操作行 end ----------->
    <a-table size="small" :dataSource="tableData" :columns="columns" rowKey="modelId" :scroll="{ x: 1000, y: yHeight }"
      bordered :pagination="false" :loading="tableLoading" :showSorterTooltip="false"
      :row-selection="{ selectedRowKeys: selectedRowKeyList, onChange: onSelectChange }" @change="onChange"
      @resizeColumn="handleResizeColumn">

      <template #bodyCell="{ record, column }">
        <template v-if="column.dataIndex === 'action'">
          <div class="smart-table-operate">
            <a-button @click="addModel(record)" type="link" v-privilege="'model:update'">编辑</a-button>
            <a-button @click="deleteModel(record)" danger type="link" v-privilege="'model:delete'">删除</a-button>
          </div>
        </template>
      </template>
    </a-table>

    <div class="smart-query-table-page">
      <a-pagination showSizeChanger showQuickJumper show-less-items :pageSizeOptions="PAGE_SIZE_OPTIONS"
        :defaultPageSize="queryForm.pageSize" v-model:current="queryForm.pageNum" v-model:pageSize="queryForm.pageSize"
        :total="total" @change="queryData" :show-total="(total) => `共${total}条`" />
    </div>

    <!-- 表单抽屉 -->
    <ModelFormModal ref="formModal" @reloadList="queryData" />

    <!-- 导入弹窗 -->
    <a-modal v-model:open="importModalVisible" title="导入机器型号数据" :confirm-loading="importLoading" @ok="handleImport"
      @cancel="handleCancelImport" okText="导入" cancelText="取消">
      <div style="text-align: center; margin-bottom: 20px;">
        <a-button type="primary" @click="downloadTemplate">
          <template #icon>
            <DownloadOutlined />
          </template>
          下载导入模板
        </a-button>
      </div>
      <a-upload-dragger v-model:fileList="fileList" name="file" :multiple="false" :before-upload="beforeUpload"
        :showUploadList="true" accept=".xls,.xlsx">
        <p class="ant-upload-drag-icon">
          <InboxOutlined style="font-size: 48px; color: #1890ff;" />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p class="ant-upload-hint">支持 .xls 或 .xlsx 格式文件</p>
      </a-upload-dragger>
    </a-modal>
  </a-card>
</template>

<script setup>
import { machineModelApi } from '/@/api/business/vending/model-api.js';
import ModelFormModal from './components/model-form-modal.vue';
import { onMounted, reactive, ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
import { smartSentry } from '/@/lib/smart-sentry';
import _ from 'lodash';
import {
  StarOutlined,
  StarFilled,
  StarTwoTone,
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
  InboxOutlined
} from '@ant-design/icons-vue';


// ---------------------------- 表格列 ----------------------------

const columns = ref([
  {
    title: '型号ID',
    dataIndex: 'modelId',
    width: 100,
    resizable: true,
    align: 'center',
  },
  {
    title: '型号名称',
    dataIndex: 'modelName',
    resizable: true,
    filterOptions: {
      type: 'input',
      key: 'modelName',
    },
    width: 200,
  },
  {
    title: '货道数量',
    dataIndex: 'aisleCount',
    resizable: true,
    width: 120,
    align: 'center',
  },
  {
    title: '单次最大限购数量',
    dataIndex: 'maxPurchase',
    resizable: true,
    width: 150,
    align: 'center',
  },
  {
    title: '备注',
    dataIndex: 'remark',
    resizable: true,
    width: 200,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    resizable: true,
    width: 180,
    sorter: true,
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    resizable: true,
    width: 180,
    sorter: true,
  },
  {
    title: '操作',
    dataIndex: 'action',
    fixed: 'right',
    width: 150,
  },
]);

// ---------------------------- 查询数据表单和方法 ----------------------------

const queryForm = reactive({
  modelName: undefined, // 型号名称
  pageNum: 1,
  pageSize: 10,
  sortItemList: [], // 添加排序项
});
// 表格加载loading
const tableLoading = ref(false);
// 表格数据
const tableData = ref([]);
// 总数
const total = ref(0);

// 导入/导出状态
const importModalVisible = ref(false);
const fileList = ref([]);
const importLoading = ref(false);

function handleResizeColumn(w, col) {
  columns.value.forEach((item) => {
    if (item.dataIndex === col.dataIndex) {
      item.width = Math.floor(w);
      item.dragAndDropFlag = true;
    }
  });
}
// 重置查询条件
function resetQuery() {
  queryForm.modelName = undefined;
  queryForm.pageNum = 1;
  onSearch();
}

// 搜索
function onSearch() {
  queryForm.pageNum = 1;
  queryData();
}

// 查询数据
async function queryData() {
  tableLoading.value = true;
  try {
    let queryResult = await machineModelApi.queryMachineModelList(queryForm);
    tableData.value = queryResult.data.list;
    total.value = queryResult.data.total;
  } catch (e) {
    smartSentry.captureError(e);
  } finally {
    tableLoading.value = false;
  }
}

onMounted(queryData);

// ---------------------------- 添加/修改 ----------------------------

const formModal = ref();

// 添加/编辑型号
function addModel(record) {
  formModal.value.showDrawer(record);
}

// ---------------------------- 删除 ----------------------------

// 单个删除
async function deleteModel(record) {
  Modal.confirm({
    title: '提示',
    content: `确定要删除型号【${record.modelName}】吗？`,
    okText: '删除',
    okType: 'danger',
    onOk: async () => {
      SmartLoading.show();
      try {
        await machineModelApi.deleteMachineModel(record.modelId);
        message.success('删除成功');
        queryData();
      } catch (e) {
        smartSentry.captureError(e);
      } finally {
        SmartLoading.hide();
      }
    },
    cancelText: '取消',
  });
}

// ---------------------------- 批量删除 ----------------------------

const selectedRowKeyList = ref([]);

function onSelectChange(selectedRowKeys) {
  selectedRowKeyList.value = selectedRowKeys;
}

// 确认批量删除
function confirmBatchDelete() {
  if (selectedRowKeyList.value.length === 0) {
    message.warning('请选择要删除的型号');
    return;
  }

  Modal.confirm({
    title: '提示',
    content: `确定要删除选中的 ${selectedRowKeyList.value.length} 个型号吗？`,
    okText: '删除',
    okType: 'danger',
    onOk: batchDelete,
    cancelText: '取消',
  });
}
// 执行批量删除
async function batchDelete() {
  try {
    SmartLoading.show();
    await machineModelApi.batchDelete(selectedRowKeyList.value);
    message.success('删除成功');
    selectedRowKeyList.value = [];
    queryData();
  } catch (e) {
    smartSentry.captureError(e);
  } finally {
    SmartLoading.hide();
  }
}

// ---------------------------- 表格排序 ----------------------------

function onChange(pagination, filters, sorter, { action }) {
  if (action === 'sort') {
    const { order, field } = sorter;
    let column = camelToUnderscore(field);
    let findIndex = queryForm.sortItemList.findIndex((e) => e.column === column);
    if (findIndex !== -1) {
      queryForm.sortItemList.splice(findIndex, 1);
    }
    if (order) {
      let isAsc = order !== 'ascend';
      queryForm.sortItemList.push({
        column,
        isAsc,
      });
    }
    queryData();
  }
}

function camelToUnderscore(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// ---------------------------- 导入/导出 ----------------------------
// 显示导入弹窗
function showImportModal() {
  importModalVisible.value = true;
  fileList.value = [];
}

// 取消导入
function handleCancelImport() {
  importModalVisible.value = false;
  fileList.value = [];
}

// 下载导入模板
async function downloadTemplate() {
  try {
    await machineModelApi.downloadModelTemplate();
    message.success('模板下载成功');
  } catch (e) {
    smartSentry.captureError(e);
    message.error('模板下载失败');
  }
}

// 处理文件上传
function beforeUpload(file) {
  const isExcel = file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (!isExcel) {
    message.error('只能上传 Excel 文件!');
    return false;
  }
  fileList.value = [file];
  return false; // 阻止自动上传
}

// 执行导入
async function handleImport() {
  if (fileList.value.length === 0) {
    message.warning('请先选择要导入的文件');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileList.value[0]);

  importLoading.value = true;
  try {
    await machineModelApi.importMachineModel(formData);
    message.success('导入成功');
    importModalVisible.value = false;
    fileList.value = [];
    queryData(); // 刷新列表
  } catch (e) {
    smartSentry.captureError(e);
    message.error(e.response?.data?.msg || '导入失败');
  } finally {
    importLoading.value = false;
  }
}

// 导出数据
async function onExportModel() {
  try {
    await machineModelApi.exportMachineModel();
    message.success('导出成功');
  } catch (e) {
    smartSentry.captureError(e);
    message.error('导出失败');
  }
}

// ---------------------------- 动态高度 ----------------------------
const yHeight = ref(0);
onMounted(() => {
  resetGetHeight();
});
function resetGetHeight() {
  let doc = document.querySelector('.ant-form');
  let btn = document.querySelector('.smart-table-btn-block');
  let tableCell = document.querySelector('.ant-table-cell');
  let page = document.querySelector('.smart-query-table-page');
  let box = document.querySelector('.admin-content');
  setTimeout(() => {
    if (!doc || !btn || !tableCell || !page || !box) {
      return;
    }
    let dueHeight = doc.offsetHeight + 10 + 24 + btn.offsetHeight + 15 + tableCell.offsetHeight + page.offsetHeight + 20;
    yHeight.value = box.offsetHeight - dueHeight;
  }, 100);
}
window.addEventListener(
  'resize',
  _.throttle(() => {
    resetGetHeight();
  }, 1000)
);
</script>