import React from 'react'
import { Lock, Globe } from 'lucide-react'

interface PrivacyIndicatorProps {
    isPrivate: boolean
    className?: string
    showTooltip?: boolean
}

const PrivacyIndicator: React.FC<PrivacyIndicatorProps> = ({
    isPrivate,
    className = '',
    showTooltip = true,
}) => {
    const tooltipId = `privacy-${Math.random().toString(36).slice(2, 9)}`

    return (
        <div className={`inline-flex items-center ${className}`}>
            <span
                id={tooltipId}
                className="flex items-center text-gray-500"
                title={
                    showTooltip
                        ? isPrivate
                            ? 'Private: Only visible to friends'
                            : 'Public: Visible to everyone'
                        : ''
                }
            >
                {isPrivate ? (
                    <Lock className="h-4 w-4" />
                ) : (
                    <Globe className="h-4 w-4" />
                )}
            </span>
        </div>
    )
}

export default PrivacyIndicator
