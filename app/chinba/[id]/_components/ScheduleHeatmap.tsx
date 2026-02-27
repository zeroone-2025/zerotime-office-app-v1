'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';
import type { ChinbaHeatmapSlot, ChinbaRecommendedTime } from '@/lib/api';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getHeatColor(unavailCount: number, total: number): string {
    if (total === 0) return 'bg-gray-100';
    if (unavailCount === 0) return 'bg-emerald-300';
    const ratio = unavailCount / total;
    if (ratio <= 0.25) return 'bg-emerald-200';
    if (ratio <= 0.5) return 'bg-emerald-100';
    if (ratio <= 0.75) return 'bg-red-300';
    if (ratio < 1) return 'bg-red-500';
    return 'bg-red-800';
}

function getTextColor(unavailCount: number, total: number): string {
    if (total === 0) return 'text-gray-300';
    if (unavailCount === 0) return 'text-emerald-700';
    const ratio = unavailCount / total;
    if (ratio <= 0.5) return 'text-gray-700';
    return 'text-white';
}

interface ScheduleHeatmapProps {
    dates: string[];
    heatmap: ChinbaHeatmapSlot[];
    recommendedTimes: ChinbaRecommendedTime[];
    startHour: number;
    endHour: number;
    totalParticipants: number;
    submittedCount: number;
}

export default function ScheduleHeatmap({
    dates,
    heatmap,
    recommendedTimes,
    startHour,
    endHour,
    totalParticipants,
    submittedCount,
}: ScheduleHeatmapProps) {
    const heatmapMap = useMemo(() => {
        const map = new Map<string, ChinbaHeatmapSlot>();
        for (const slot of heatmap) {
            map.set(slot.dt, slot);
        }
        return map;
    }, [heatmap]);

    const timeSlots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
        timeSlots.push(`${String(h).padStart(2, '0')}:00`);
        timeSlots.push(`${String(h).padStart(2, '0')}:30`);
    }

    const dateInfos = dates.map((d) => {
        const dt = new Date(d);
        return {
            dateStr: d,
            label: `${dt.getMonth() + 1}/${dt.getDate()}`,
            day: DAY_LABELS[dt.getDay()],
        };
    });

    return (
        <div className="space-y-4">
            {/* Heatmap Grid */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">전체 일정 히트맵</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-fit">
                            {/* Date headers */}
                            <div className="flex">
                                <div className="w-14 shrink-0" />
                                {dateInfos.map((info) => (
                                    <div
                                        key={info.dateStr}
                                        className="flex flex-col items-center justify-center py-1"
                                        style={{ width: 40 }}
                                    >
                                        <span className="text-[10px] text-muted-foreground">{info.day}</span>
                                        <span className="text-xs font-medium">{info.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Time rows */}
                            {timeSlots.map((time) => (
                                <div key={time} className="flex">
                                    <div className="w-14 shrink-0 flex items-center justify-end pr-2">
                                        {time.endsWith(':00') && (
                                            <span className="text-xs text-muted-foreground">{parseInt(time)}:00</span>
                                        )}
                                    </div>
                                    {dateInfos.map((info) => {
                                        const dtKey = `${info.dateStr}T${time}:00`;
                                        const slot = heatmapMap.get(dtKey);
                                        const unavailCount = slot?.unavailable_count ?? 0;
                                        const availCount = submittedCount - unavailCount;
                                        const bgColor = getHeatColor(unavailCount, submittedCount);
                                        const txtColor = getTextColor(unavailCount, submittedCount);
                                        const isHourBorder = time.endsWith(':00');

                                        const cell = (
                                            <div
                                                className={`flex items-center justify-center border-r border-gray-200 ${bgColor} ${
                                                    isHourBorder ? 'border-t border-t-gray-300' : 'border-t border-t-gray-200/50'
                                                } transition-opacity hover:opacity-80`}
                                                style={{ width: 40, height: 24 }}
                                            >
                                                {submittedCount > 0 && availCount > 0 && (
                                                    <span className={`text-[10px] font-bold ${txtColor}`}>{availCount}</span>
                                                )}
                                            </div>
                                        );

                                        if (slot && slot.unavailable_count > 0) {
                                            return (
                                                <Tooltip key={dtKey}>
                                                    <TooltipTrigger asChild>
                                                        {cell}
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p className="font-medium">
                                                            {dtKey.substring(5, 10)} {dtKey.substring(11, 16)} - {slot.unavailable_count}명 불가
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {slot.unavailable_members.join(', ')}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        }

                                        return <div key={dtKey}>{cell}</div>;
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <span className="text-xs text-muted-foreground">가능</span>
                        <div className="w-4 h-3 rounded-sm bg-emerald-300" />
                        <div className="w-4 h-3 rounded-sm bg-emerald-200" />
                        <div className="w-4 h-3 rounded-sm bg-emerald-100" />
                        <div className="w-4 h-3 rounded-sm bg-red-300" />
                        <div className="w-4 h-3 rounded-sm bg-red-500" />
                        <div className="w-4 h-3 rounded-sm bg-red-800" />
                        <span className="text-xs text-muted-foreground">불가</span>
                    </div>
                </CardContent>
            </Card>

            {/* Recommended Times */}
            {recommendedTimes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">추천 시간</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {recommendedTimes.map((rec, idx) => {
                                const dt = new Date(rec.date);
                                const dayLabel = DAY_LABELS[dt.getDay()];
                                const dateLabel = `${dt.getMonth() + 1}/${dt.getDate()}(${dayLabel})`;

                                return (
                                    <Card key={idx} className="border">
                                        <CardContent className="pt-4 pb-3 px-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-sm">{dateLabel}</span>
                                                <Badge variant={rec.all_available ? 'default' : 'secondary'}>
                                                    {rec.all_available ? '전원 가능' : `${rec.available_count}/${totalParticipants}명`}
                                                </Badge>
                                            </div>
                                            <p className="text-lg font-semibold">
                                                {rec.start_time} ~ {rec.end_time}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {rec.available_count}명 가능
                                                {rec.all_available && ' (전원)'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
