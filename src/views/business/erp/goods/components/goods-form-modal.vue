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
        <a-input-number style="width: 100%" placeholder="请输入商品价格" v-model:value="form.price" :min="0" :max="99999999.99"
          :precision="2" :step="0.01" :formatter="value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="value => value.replace(/¥\s?|(,*)/g, '')" />
      </a-form-item>
      <a-form-item label="商品图片" name="goodsImage">
        <a-upload v-model:file-list="fileList" name="file" list-type="picture-card" class="goods-uploader"
          :show-upload-list="false" :before-upload="beforeUpload" :customRequest="handleUpload">
          <div v-if="form.goodsImage">
            <img :src="form.goodsImage" alt="商品图片" style="width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div v-else>
            <div style="margin-top: 8px">
              <plus-outlined />
              <div class="ant-upload-text">上传图片</div>
            </div>
          </div>
        </a-upload>
        <div class="upload-tip" v-if="!form.goodsImage">
          支持 JPG/PNG 格式，大小不超过 2MB
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
import { message, Modal, Upload } from 'ant-design-vue';
import dayjs from 'dayjs';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { goodsApi } from '/@/api/business/goods/goods-api';
import { fileApi } from '/@/api/support/file-api';
import { smartSentry } from '/@/lib/smart-sentry';
import _ from 'lodash';
import CategoryTree from '/@/components/business/category-tree-select/index.vue';
import { CATEGORY_TYPE_ENUM } from '/@/constants/business/erp/category-const';
import { GOODS_STATUS_ENUM } from '/@/constants/business/erp/goods-const';
import SmartEnumSelect from '/@/components/framework/smart-enum-select/index.vue';
import DictSelect from '/@/components/support/dict-select/index.vue';
import { DICT_CODE_ENUM } from '/@/constants/support/dict-const';
import { PlusOutlined } from '@ant-design/icons-vue';

// emit
const emit = defineEmits(['reloadList']);

// 组件ref
const formRef = ref();
const fileList = ref([]);

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
    // { required: true, message: '商品图片不能为空' }
  ],
  remark: [
    { max: 255, message: '备注不能超过255个字符' }
  ]
};

// 是否展示抽屉
const visible = ref(false);


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

// 上传前的校验
const beforeUpload = (file) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isImage) {
    message.error('只能上传 JPG/PNG 格式的图片!');
    return Upload.LIST_IGNORE;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!');
    return Upload.LIST_IGNORE;
  }
  return true;
};

// 自定义上传处理
const handleUpload = async ({ file, onSuccess, onError }) => {
  try {
    SmartLoading.show('正在上传图片...');
    const formData = new FormData();
    formData.append('file', file);

    // 调用后端文件上传接口，指定文件夹为 goods
    const result = await fileApi.uploadFile(formData, 'goods');
    
    // 根据实际返回结构调整
    if (result && result.data) {
      // 尝试不同的可能返回字段
      const imageUrl = result.data.url || result.data.fileUrl || (result.data.data && result.data.data.url);
      if (imageUrl) {
        form.goodsImage = imageUrl;
        onSuccess();
        message.success('上传成功');
        return;
      }
    }
    throw new Error('上传失败：无效的响应格式');
  } catch (error) {
    console.error('上传失败:', error);
    let errorMessage = '上传失败';
    if (error.response) {
      // 服务器返回了错误响应
      errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
    } else if (error.request) {
      // 请求已发送但未收到响应
      errorMessage = '无法连接到服务器，请检查网络连接';
    }
    message.error(errorMessage);
    onError(errorMessage);
  } finally {
    SmartLoading.hide();
  }
};

// 修改 showDrawer 方法，在编辑时初始化图片
function showDrawer(rowData) {
  Object.assign(form, formDefault);
  if (rowData && !_.isEmpty(rowData)) {
    Object.assign(form, rowData);
    // 初始化文件列表
    if (rowData.goodsImage) {
      fileList.value = [{
        uid: '-1',
        name: '商品图片',
        status: 'done',
        url: rowData.goodsImage
      }];
    }
  }
  if (form.place && form.place.length > 0) {
    form.place = form.place.split(',');
  }

  visible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}
</script>
<style scoped>
.goods-uploader :deep(.ant-upload) {
  width: 100px;
  height: 100px;
  margin: 0 auto;
  display: block;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  text-align: center;
  margin-top: 8px;
}
</style>