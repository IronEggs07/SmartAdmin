<!--
  * 商品表单
  *
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-07-21 21:55:12
  * @Wechat:    zhuda1024
  * @Email:     lab1024@163.com
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
-->
<template>
  <a-drawer :title="form.goodsId ? '编辑' : '添加'" :width="500" :open="visible" :body-style="{ paddingBottom: '80px' }"
    @close="onClose">
    <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 5 }">
      <a-form-item label="商品分类" name="categoryId">
        <CategoryTree v-model:value="form.categoryId" placeholder="请选择商品分类"
          :categoryType="CATEGORY_TYPE_ENUM.GOODS.value" />
      </a-form-item>
      <a-form-item label="商品名称" name="goodsName">
        <a-input v-model:value="form.goodsName" placeholder="请输入商品名称" />
      </a-form-item>
      <a-form-item label="商品状态" name="goodsStatus">
        <SmartEnumSelect enum-name="GOODS_STATUS_ENUM" v-model:value="form.goodsStatus" />
      </a-form-item>
      <a-form-item label="产地" name="place">
        <DictSelect width="100%" :dict-code="DICT_CODE_ENUM.GOODS_PLACE" v-model:value="form.place" mode="tags" />
      </a-form-item>
      <a-form-item label="上架状态" name="shelvesFlag">
        <a-radio-group v-model:value="form.shelvesFlag">
          <a-radio :value="true">上架</a-radio>
          <a-radio :value="false">下架</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="商品价格" name="price">
        <a-input-number 
          style="width: 100%" 
          placeholder="请输入商品价格" 
          v-model:value="form.price" 
          :min="0" 
          :max="99999999.99"
          :precision="2"
          :step="0.01"
          :formatter="value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="value => value.replace(/¥\s?|(,*)/g, '')"
        />
      </a-form-item>
      <a-form-item label="商品图片" name="goodsImage">
        <a-input v-model:value="form.goodsImage" placeholder="请输入图片URL" />
        <div v-if="form.goodsImage" style="margin-top: 8px;">
          <a-image :width="100" :src="form.goodsImage" :fallback="'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHN0eWxlPSJmaWxsOiNmNWY1ZjU7c3Ryb2tlOiNkZGQ7c3Ryb2tlLXdpZHRoOjFweDsiLz4KICA8dGV4dCB4PSIzMCIgeT0iMzIiIGZvbnQtZmFtaWx5PSJBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+6K+36L6T5YWlPC90ZXh0Pgo8L3N2Zz4='" />
        </div>
      </a-form-item>
      <a-form-item label="备注" name="remark">
        <a-textarea v-model:value="form.remark" placeholder="请输入备注" :rows="4" />
      </a-form-item>
      <template v-if="form.goodsId">
        <a-form-item label="创建时间">
          <span>{{ form.createTime ? dayjs(form.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}</span>
        </a-form-item>
        <a-form-item label="更新时间">
          <span>{{ form.updateTime ? dayjs(form.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}</span>
        </a-form-item>
      </template>
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
import { ref, reactive, nextTick } from 'vue';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { goodsApi } from '/@/api/business/goods/goods-api';
import { smartSentry } from '/@/lib/smart-sentry';
import _ from 'lodash';
import CategoryTree from '/@/components/business/category-tree-select/index.vue';
import { CATEGORY_TYPE_ENUM } from '/@/constants/business/erp/category-const';
import { GOODS_STATUS_ENUM } from '/@/constants/business/erp/goods-const';
import SmartEnumSelect from '/@/components/framework/smart-enum-select/index.vue';
import DictSelect from '/@/components/support/dict-select/index.vue';
import { DICT_CODE_ENUM } from '/@/constants/support/dict-const';

// emit
const emit = defineEmits(['reloadList']);

// 组件ref
const formRef = ref();

const formDefault = {
  // 商品ID
  goodsId: undefined,
  // 商品分类
  categoryId: undefined,
  // 商品名称
  goodsName: undefined,
  // 商品状态
  goodsStatus: GOODS_STATUS_ENUM.APPOINTMENT.value,
  // 产地
  place: [],
  // 商品价格
  price: undefined,
  // 上架状态
  shelvesFlag: true,
  // 商品图片
  goodsImage: '',
  // 备注
  remark: '',
  // 删除标志
  deletedFlag: false,
  // 创建时间
  createTime: undefined,
  // 更新时间
  updateTime: undefined,
};

let form = reactive({ ...formDefault });

const rules = {
  categoryId: [{ required: true, message: '请选择商品分类' }],
  goodsName: [
    { required: true, message: '商品名称不能为空' },
    { max: 50, message: '商品名称不能超过50个字符' }
  ],
  goodsStatus: [{ required: true, message: '商品状态不能为空' }],
  place: [
    { required: true, message: '产地不能为空' },
    { 
      validator: (_, value) => {
        if (value && value.length > 255) {
          return Promise.reject('产地不能超过255个字符');
        }
        return Promise.resolve();
      }
    }
  ],
  price: [
    { required: true, message: '商品价格不能为空' },
    { 
      type: 'number', 
      min: 0, 
      max: 99999999.99,
      message: '价格必须为0-99999999.99之间的数字'
    }
  ],
  goodsImage: [
    { max: 255, message: '图片地址不能超过255个字符' }
  ],
  remark: [
    { max: 255, message: '备注不能超过255个字符' }
  ]
};

// 是否展示抽屉
const visible = ref(false);

function showDrawer(rowData) {
  Object.assign(form, formDefault);
  if (rowData && !_.isEmpty(rowData)) {
    Object.assign(form, rowData);
  }
  if (form.place && form.place.length > 0) {
    form.place = form.place.split(',');
  }

  visible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

function onClose() {
  Object.assign(form, formDefault);
  visible.value = false;
}

function onSubmit() {
  formRef.value
    .validate()
    .then(async () => {
      SmartLoading.show();
      try {
        // 关键：创建一个提交用的副本，并处理数据格式
        const submitForm = { ...form };
        if (Array.isArray(submitForm.place)) {
          submitForm.place = submitForm.place.join(',');
        }

        if (submitForm.goodsId) {
          await goodsApi.updateGoods(submitForm); // 提交转换后的数据
        } else {
          await goodsApi.addGoods(submitForm);    // 提交转换后的数据
        }
        message.success(`${form.goodsId ? '修改' : '添加'}成功`);
        onClose();
        emit('reloadList');
      } catch (error) {
        smartSentry.captureError(error);
      } finally {
        SmartLoading.hide();
      }
    })
    .catch((error) => {
      console.log('error', error);
      message.error('参数验证错误，请仔细填写表单数据!');
    });
}
defineExpose({
  showDrawer,
});
</script>
