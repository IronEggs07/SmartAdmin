// /*
//  * 厂家管理路由
//  *
//  * @Author:    1024创新实验室-主任：卓大
//  * @Date:      2025-09-11 08:58:04
//  * @Wechat:    zhuda1024
//  * @Email:     lab1024@163.com
//  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
//  */
// import { MENU_TYPE_ENUM } from '/@/constants/system/menu-const';
// import SmartLayout from '/@/layout/index.vue';

// // 厂家管理路由
// export const manufacturerRouters = [
//   {
//     path: '/manufacturer',
//     name: 'Manufacturer',
//     component: SmartLayout,
//     meta: {
//       title: '厂家管理',
//       menuType: MENU_TYPE_ENUM.CATALOG.value,
//       icon: 'ShopOutlined',
//       keepAlive: true,
//       requiresAuth: true,
//       permissions: ['manufacturer:query']
//     },
//     children: [
//       // 厂家列表
//       {
//         path: 'list',
//         name: 'ManufacturerList',
//         component: () => import('/@/views/business/erp/manufacturer/manufacturer-list.vue'),
//         meta: {
//           title: '厂家列表',
//           menuType: MENU_TYPE_ENUM.MENU.value,
//           icon: 'UnorderedListOutlined',
//           keepAlive: true,
//           requiresAuth: true,
//           permissions: ['manufacturer:query']
//         }
//       }
//     ]
//   }
// ];

// // 导出路由数据
// export default manufacturerRouters;