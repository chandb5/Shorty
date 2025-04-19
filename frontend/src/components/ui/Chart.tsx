"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

import { cn } from "../../lib/utils"

interface ChartProps {
  data: any[]
  xAxisDataKey: string
  bars: {
    dataKey: string
    name: string
    color: string
  }[]
  className?: string
  height?: number
}

export function Chart({
  data,
  xAxisDataKey,
  bars,
  className,
  height = 300,
  ...props
}: ChartProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey={xAxisDataKey} 
            tick={{ fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickMargin={8}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--background)", 
              borderColor: "var(--border)",
              borderRadius: "0.5rem"
            }}
            cursor={{ fill: "var(--accent)", opacity: 0.1 }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
