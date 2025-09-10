// /*
//  * @Description:
//  * @Author: zhuoda
//  * @Date: 2021-11-05
//  * @LastEditTime: 2022-06-23
//  * @LastEditors: zhuoda
//  */
// import {postRequest, getRequest, getDownload} from '/@/lib/axios';

// export const goodsApi = {
//   // 添加商品 @author zhuoda
//   addGoods: (param) => {
//     return postRequest('/goods/add', param);
//   },
//   // 删除 @author zhuoda
//   deleteGoods: (goodsId) => {
//     return getRequest(`/goods/delete/${goodsId}`);
//   },
//   // 批量 @author zhuoda
//   batchDelete: (goodsIdList) => {
//     return postRequest('/goods/batchDelete', goodsIdList);
//   },
//   // 分页查询 @author zhuoda
//   queryGoodsList: (param) => {
//     return postRequest('/goods/query', param);
//   },
//   // 更新商品 @author zhuoda
//   updateGoods: (param) => {
//     return postRequest('/goods/update', param);
//   },

//   // 导入 @author 卓大
//   importGoods : (file) =>{
//     return postRequest('/goods/importGoods',file);
//   },

//   // 导出 @author 卓大
//   exportGoods : () =>{
//     return getDownload('/goods/exportGoods');
//   }
// };
import request from '/@/utils/request';

const API = {
  // 分页查询
  page: '/erp/manufacturer/page',
  // 添加
  add: '/erp/manufacturer/add',
  // 修改
  update: '/erp/manufacturer/update',
  // 删除
  delete: '/erp/manufacturer/delete',
  // 详情
  detail: '/erp/manufacturer/detail'
};

// 分页查询
export function pageManufacturer(params) {
  return request({
    url: API.page,
    method: 'get',
    params
  });
}

// 添加
export function addManufacturer(data) {
  return request({
    url: API.add,
    method: 'post',
    data
  });
}

// 修改
export function updateManufacturer(data) {
  return request({
    url: API.update,
    method: 'put',
    data
  });
}

// 删除
export function deleteManufacturer(id) {
  return request({
    url: `${API.delete}/${id}`,
    method: 'delete'
  });
}

// 获取详情
export function getManufacturerDetail(id) {
  return request({
    url: `${API.detail}/${id}`,
    method: 'get'
  });
}