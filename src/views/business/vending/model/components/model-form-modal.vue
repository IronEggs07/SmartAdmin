<!--
  * 机器型号表单（抽屉样式）
-->
<template>
    <a-drawer :title="form.modelId ? '编辑型号' : '新增型号'" :width="500" :open="visible" :body-style="{ paddingBottom: '80px' }" @close="onClose">
      <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 8 }">
        <a-form-item label="型号名称" name="modelName">
          <a-input v-model:value="form.modelName" placeholder="请输入型号名称" />
        </a-form-item>
        <a-form-item label="货道数量" name="aisleCount">
          <a-input-number v-model:value="form.aisleCount" :min="1" :max="100" style="width: 100%" placeholder="请输入货道数量" />
        </a-form-item>
        <a-form-item label="单次最大限购数量" name="maxPurchase">
          <a-input-number v-model:value="form.maxPurchase" :min="1" :max="100" style="width: 100%" placeholder="请输入单次最大限购数量" />
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="form.remark" placeholder="请输入备注信息" :rows="3" />
        </a-form-item>
      </a-form>
      <div
        :style="{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '100%',
          borderTop: '1px solid #e9e9e9',
          padding: '10px 16px',
          background: '#fff',
          textAlign: 'right',
          zIndex: 1,
        }"
      >
        <a-button style="margin-right: 8px" @click="onClose">取消</a-button>
        <a-button type="primary" @click="onSubmit">提交</a-button>
      </div>
    </a-drawer>
  </template>
  
  <script setup>
  import { ref, reactive, nextTick } from 'vue';
  import { message } from 'ant-design-vue';
  import { SmartLoading } from '/@/components/framework/smart-loading';
  import { machineModelApi } from '/@/api/business/vending/model-api';
  import { smartSentry } from '/@/lib/smart-sentry';
  import _ from 'lodash';
  
  // 定义emit事件，用于通知父组件刷新列表
  const emit = defineEmits(['reloadList']);
  
  // 表单的ref
  const formRef = ref();
  
  // 默认表单数据
  const formDefault = {
    modelId: undefined,
    modelName: undefined,
    aisleCount: undefined,
    maxPurchase: undefined,
    remark: undefined,
  };
  
  // 响应式的表单数据
  let form = reactive({ ...formDefault });
  
  // 表单验证规则
  const rules = {
    modelName: [
      { required: true, message: '请输入型号名称', trigger: 'blur' },
      { max: 100, message: '型号名称不能超过100个字符', trigger: 'blur' },
    ],
    aisleCount: [
      { required: true, message: '请输入货道数量', trigger: 'blur' },
      { type: 'number', min: 1, max: 100, message: '货道数量必须在1-100之间', trigger: 'blur' },
    ],
    maxPurchase: [
      { required: true, message: '请输入单次最大限购数量', trigger: 'blur' },
      { type: 'number', min: 1, max: 100, message: '单次最大限购数量必须在1-100之间', trigger: 'blur' },
    ],
    remark: [
      { max: 255, message: '备注不能超过255个字符', trigger: 'blur' },
    ],
  };
  
  // 控制抽屉是否显示
  const visible = ref(false);
  
  // 显示抽屉的方法，接收行数据作为参数
  function showDrawer(rowData) {
    // 重置表单为默认值
    Object.assign(form, formDefault);
    // 如果传入了行数据（编辑模式），则用行数据覆盖表单
    if (rowData && !_.isEmpty(rowData)) {
      Object.assign(form, rowData);
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
          // 根据是否存在modelId判断是更新还是添加
          if (form.modelId) {
            await machineModelApi.updateMachineModel(form);
          } else {
            await machineModelApi.addMachineModel(form);
          }
          message.success(`${form.modelId ? '更新' : '添加'}成功`);
          onClose(); // 关闭抽屉
          emit('reloadList'); // 通知父组件刷新列表
        } catch (error) {
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