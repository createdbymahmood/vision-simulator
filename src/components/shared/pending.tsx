import {get, range} from 'lodash-es'
import React from 'react'

import {Skeleton} from '@/components/ui/skeleton'
import {cn} from '@/lib/utils'

const widthMap = {
  0: 'tw:w-full',
  1: 'tw:w-full',
  2: 'tw:w-3/4',
}

export const Pending: React.FC = () => {
  return (
    <div className='vs:my-5 vs:w-full vs:container'>
      <div className='vs:flex vs:flex-col vs:gap-2 vs:py-5'>
        {range(0, 3).map((index) => {
          return (
            <Skeleton
              className={cn('vs:h-7', get(widthMap, index))}
              key={index}
            />
          )
        })}
      </div>
    </div>
  )
}
