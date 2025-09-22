/**
 * ERP - 机器类型管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';

export const machineModelApi = {

  queryMachineModelList: (param) => {
    return postRequest('/vending/model/query', param);
  },


  addMachineModel: (param) => {
    return postRequest('/vending/model/add', param);
  },


  updateMachineModel: (param) => {
    return postRequest('/vending/model/update', param);
  },


  deleteMachineModel: (modelId) => {
    return getRequest(`/vending/model/delete/${modelId}`);
  },


  batchDelete: (modelIdList) => {
    return postRequest('/vending/model/batchDelete', modelIdList);
  },


  /**
   * 导出机器型号数据
   * @returns {Promise} 返回文件下载流
   */
  exportMachineModel: () => {
    return getDownload('/vending/model/export');
  },

  /**
   * 导入机器型号数据
   * @param {File} file 导入的文件
   * @returns {Promise} 返回导入结果
   */
  importMachineModel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return postRequest('/vending/model/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * 下载导入模板
   * @returns {Promise} 返回文件下载流
   */
  downloadModelTemplate: () => {
    return getDownload('/vending/model/downloadTemplate');
  },
};