<!--
  * 机器表单（抽屉样式）
-->
<template>
  <a-drawer :title="form.machineId ? '编辑机器' : '新增机器'" :width="500" :open="visible"
    :body-style="{ paddingBottom: '80px' }" @close="onClose">
    <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 5 }">
      <a-form-item label="机器名称" name="machineName">
        <a-input v-model:value="form.machineName" placeholder="请输入机器名称" />
      </a-form-item>
      <a-form-item label="机器编码" name="machineCode">
        <a-input v-model:value="form.machineCode" placeholder="请输入机器编码" />
      </a-form-item>

      <a-form-item label="所属分组" name="groupId">
        <a-input v-model:value="form.groupId" placeholder="请输入所属分组" />
      </a-form-item>

      <a-form-item label="机器型号" name="modelId">
        <a-input v-model:value="form.modelId" placeholder="请输入机器型号" />
      </a-form-item>

      <a-form-item label="所属仓库" name="warehouseId">
        <a-input v-model:value="form.warehouseId" placeholder="请输入所属仓库" />
      </a-form-item>
      <a-form-item label="机器地址" name="machineAddress">
        <a-input v-model:value="form.machineAddress" placeholder="请输入机器地址" :maxlength="255" show-count />
      </a-form-item>
      <a-form-item label="机器状态" name="machineStatus">
        <a-select v-model:value="form.machineStatus" placeholder="请选择机器状态">
          <a-select-option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.desc }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
    <div :style="{
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: '100%',
      borderTop: '1px solid #e9e9e9',
      padding: '10px 16px',
      background: '#fff',
      textAlign: 'right',
      zIndex: 1,
    }">
      <a-button style="margin-right: 8px" @click="onClose">取消</a-button>
      <a-button type="primary" @click="onSubmit">提交</a-button>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { machineApi } from '/@/api/business/vending/machine-api';
import { MACHINE_STATUS_ENUM } from '/@/constants/business/vending/machine-const';
import { smartSentry } from '/@/lib/smart-sentry';
import _ from 'lodash';


// 定义emit事件，用于通知父组件刷新列表
const emit = defineEmits(['reloadList']);

// 表单的ref
const formRef = ref();

// 下拉选项数据
// const groupList = ref([]);      // 分组列表
// const modelList = ref([]);      // 型号列表
// const warehouseList = ref([]);  // 仓库列表
// const loading = ref(false);     // 加载状态



// 状态选项
const statusOptions = Object.values(MACHINE_STATUS_ENUM);

// 默认表单数据
const formDefault = {
  machineId: undefined,
  machineName: undefined,
  machineCode: undefined,
  groupId: undefined,
  modelId: undefined,
  warehouseId: undefined,
  machineAddress: undefined,
  machineStatus: MACHINE_STATUS_ENUM.NORMAL.value, // 默认正常状态
};

// 响应式的表单数据
let form = reactive({ ...formDefault });


// 表单验证规则
const rules = {
  machineName: [{ required: true, message: '请输入机器名称', trigger: 'blur' }],
  machineCode: [{ required: true, message: '请输入机器编码', trigger: 'blur' }],
  groupId: [
    { required: true, message: '请选择分组', trigger: 'change' }
  ],
  modelId: [
    { required: true, message: '请选择型号', trigger: 'change' }
  ],
  warehouseId: [
    { required: true, message: '请选择仓库', trigger: 'change' }
  ],
  machineAddress: [
    { required: true, message: '请输入机器地址', trigger: 'blur' },
    { max: 255, message: '地址最多255个字符', trigger: 'blur' }
  ],
  machineStatus: [{ required: true, message: '请选择机器状态', trigger: 'change' }],
};

// 控制抽屉是否显示
const visible = ref(false);

// 显示抽屉的方法，接收行数据作为参数
function showDrawer(rowData) {
  // 重置表单为默认值
  Object.assign(form, formDefault);
  // 如果传入了行数据（编辑模式），则用行数据覆盖表单
  if (rowData && !_.isEmpty(rowData)) {
    // 处理状态值，确保是数字类型
    const rowDataCopy = { ...rowData };
    if (rowDataCopy.machineStatus) {
      rowDataCopy.machineStatus = Number(rowDataCopy.machineStatus);
    }
    Object.assign(form, rowDataCopy);
  }
  // 打开抽屉
  visible.value = true;
  // 使用nextTick确保DOM更新后清除之前的校验信息
  nextTick(() => {
    formRef.value.clearValidate();
  });
}

// 关闭抽屉
function onClose() {
  // 重置表单并关闭
  Object.assign(form, formDefault);
  visible.value = false;
}

// 提交表单
function onSubmit() {
  formRef.value
    .validate()
    .then(async () => {
      SmartLoading.show();
      try {
        // 根据是否存在machineId判断是更新还是添加
        if (form.machineId) {
          await machineApi.updateMachine(form);
        } else {
          await machineApi.addMachine(form);
        }
        message.success(`${form.machineId ? '更新' : '添加'}成功`);
        onClose(); // 关闭抽屉
        emit('reloadList'); // 通知父组件刷新列表
      } catch (error) {
        console.error('提交失败:', error);
        smartSentry.captureError(error);
      } finally {
        SmartLoading.hide();
      }
    })
    .catch(() => {
      message.error('参数验证错误，请仔细填写表单数据!');
    });
}

// 使用defineExpose暴露方法，让父组件可以通过ref调用
defineExpose({
  showDrawer,
});
</script>