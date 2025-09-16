<!--
  * 厂家表单（抽屉样式）
-->
<template>
    <a-drawer :title="form.manufacturerId ? '编辑厂家' : '新增厂家'" :width="500" :open="visible" :body-style="{ paddingBottom: '80px' }" @close="onClose">
      <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 5 }">
        <a-form-item label="厂家名称" name="manufacturerName">
          <a-input v-model:value="form.manufacturerName" placeholder="请输入厂家名称" />
        </a-form-item>
        <a-form-item label="联系人" name="contactPerson">
          <a-input v-model:value="form.contactPerson" placeholder="请输入联系人" />
        </a-form-item>
        <a-form-item label="联系电话" name="contactPhone">
          <a-input v-model:value="form.contactPhone" placeholder="请输入联系电话" />
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
  import { manufacturerApi } from '/@/api/business/manufacturer/manufacturer-api';
  import { smartSentry } from '/@/lib/smart-sentry';
  import _ from 'lodash';
  
  // 定义emit事件，用于通知父组件刷新列表
  const emit = defineEmits(['reloadList']);
  
  // 表单的ref
  const formRef = ref();
  
  // 默认表单数据
  const formDefault = {
    manufacturerId: undefined,
    manufacturerName: undefined,
    contactPerson: undefined,
    contactPhone: undefined,
  };
  
  // 响应式的表单数据
  let form = reactive({ ...formDefault });
  
  // 表单验证规则
  const rules = {
    manufacturerName: [{ required: true, message: '请输入厂家名称', trigger: 'blur' }],
    contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
    contactPhone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
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
          // 根据是否存在manufacturerId判断是更新还是添加
          if (form.manufacturerId) {
            await manufacturerApi.updateManufacturer(form);
          } else {
            await manufacturerApi.addManufacturer(form);
          }
          message.success(`${form.manufacturerId ? '更新' : '添加'}成功`);
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