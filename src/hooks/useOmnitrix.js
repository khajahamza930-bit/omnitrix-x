import { useState, useEffect } from 'react'

export const ENERGY_COST = 30
const COOLDOWN_TIME = 5

// this hook handles the device: status, energy and timers
// status can be: idle, transforming, transformed, cooldown
function useOmnitrix(duration) {
  const [status, setStatus] = useState('idle')
  const [energy, setEnergy] = useState(100)
  const [timeLeft, setTimeLeft] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [message, setMessage] = useState('System ready. Select an alien.')

  function startTransform(alien) {
    // ignore clicks if the device is already busy
    if (status !== 'idle') {
      setMessage('Device is busy, please wait')
      return
    }
    if (energy < ENERGY_COST) {
      setMessage('Low energy! You need ' + ENERGY_COST + '% to transform')
      return
    }
    setEnergy(energy - ENERGY_COST)
    setStatus('transforming')
    setMessage('Syncing DNA of ' + alien.name + '...')
  }

  function revert(isAuto) {
    setCooldown(COOLDOWN_TIME)
    setStatus('cooldown')
    if (isAuto) {
      setMessage('Time is over. Back to human form.')
    } else {
      setMessage('Back to human form.')
    }
  }

  // syncing takes 2 seconds, then the transformation starts
  useEffect(() => {
    if (status !== 'transforming') return
    const timer = setTimeout(() => {
      setTimeLeft(duration)
      setStatus('transformed')
      setMessage('Transformation complete!')
    }, 2000)
    return () => clearTimeout(timer)
  }, [status, duration])

  // count down every second while transformed
  useEffect(() => {
    if (status !== 'transformed') return
    if (timeLeft <= 0) {
      revert(true)
      return
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [status, timeLeft])

  // cooldown countdown
  useEffect(() => {
    if (status !== 'cooldown') return
    if (cooldown <= 0) {
      setStatus('idle')
      setMessage('Device is ready.')
      return
    }
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [status, cooldown])

  // energy recharges 1% every second when idle
  useEffect(() => {
    if (status !== 'idle' || energy >= 100) return
    const timer = setTimeout(() => setEnergy(energy + 1), 1000)
    return () => clearTimeout(timer)
  }, [status, energy])

  return { status, energy, timeLeft, cooldown, message, setMessage, startTransform, revert }
}

export default useOmnitrix