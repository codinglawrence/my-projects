import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'
import ActivityView from '../views/ActivityView.vue'
import HistoryView from '../views/HistoryView.vue'
import CategoryView from '../views/CategoryView.vue'
import MoreView from '../views/MoreView.vue'
import TimeDebtView from '../views/timedebt.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/activity'
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'activity',
          name: 'activity',
          component: ActivityView,
        },
        {
          path: 'history',
          name: 'history',
          component: HistoryView,
        },
        {
          path: 'category',
          name: 'category',
          component: CategoryView,
        },
        {
          path: 'timedebt',
          name: 'timeDebt',
          component: TimeDebtView,
        },
        {
          path: 'more',
          name: 'more',
          component: MoreView,
        },
      ],
    },
  ],
})

export default router
