import {get, range} from 'lodash-es'
import React from 'react'

import {Skeleton} from '@/components/ui/skeleton'
import {cn} from '@/lib/utils'

const widthMap = {
  0: 'w-full',
  1: 'w-full',
  2: 'w-3/4',
}

export const Pending: React.FC = () => {
  return (
    <div className='my-5 w-full container'>
      <div className='flex flex-col gap-2 py-5'>
        {range(0, 3).map((index) => {
          return (
            <Skeleton className={cn('h-7', get(widthMap, index))} key={index} />
          )
        })}
      </div>
    </div>
  )
}
