'use client';

import {
  Children,
  ReactElement,
  ReactNode,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useDidMountEffect from '../hooks/useDidMountEffect';

interface IProps {
  show: boolean;
  name?: string;
  children: ReactNode;
}

// enter-active
// enter-from 0 => enter-to 1

// leave-active
// leave-from 1 => leave-to 0

/*
enter-from: 진입 시작 상태. 엘리먼트가 삽입되기 전에 추가되고, 엘리먼트가 삽입되고 1 프레임 후 제거됩니다.

enter-active: 진입 활성 상태. 모든 진입 상태에 적용됩니다. 엘리먼트가 삽입되기 전에 추가되고, 트랜지션/애니메이션이 완료되면 제거됩니다. 이 클래스는 진입 트랜지션에 대한 지속 시간, 딜레이 및 이징(easing) 곡선을 정의하는 데 사용할 수 있습니다.

enter-to: 진입 종료 상태. 엘리먼트가 삽입된 후 1 프레임 후 추가되고(동시에 enter-from이 제거됨), 트랜지션/애니메이션이 완료되면 제거됩니다.

leave-from: 진출 시작 상태. 진출 트랜지션이 트리거되면 즉시 추가되고 1 프레임 후 제거됩니다.

leave-active: 진출 활성 상태. 모든 진출 상태에 적용됩니다. 진출 트랜지션이 트리거되면 즉시 추가되고, 트랜지션/애니메이션이 완료되면 제거됩니다. 이 클래스는 진출 트랜지션에 대한 지속 시간, 딜레이 및 이징 곡선을 정의하는 데 사용할 수 있습니다.

leave-to: 진출 종료 상태. 진출 트랜지션이 트리거된 후 1 프레임이 추가되고(동시에 leave-from이 제거됨), 트랜지션/애니메이션이 완료되면 제거됩니다.
*/

/*
  0 미동작

  - enter -
  1. active - true, from - true, render - true : ms 1
  2. from - false, to - true
  3. to - false, active - false

  - leave -
  1. active - true, from - true
  2. from - false, to - true
  3. to - false, active - false, render - false
*/
function convertToMilliseconds(timeString: string): number {
  // '0.5s' 형식의 문자열에서 숫자 부분과 단위 부분을 분리합니다.
  const numericValue = parseFloat(timeString);
  const unit = timeString.slice(-1);

  // 단위에 따라 적절한 계수를 사용하여 밀리초로 변환합니다.
  switch (unit) {
    case 's':
      return numericValue * 1000;
    default:
      throw new Error('Unsupported unit. Only "s" (seconds) is supported.');
  }
}

function Transition({ show, name = 'default', children }: IProps) {
  const DEFAULT_DURATION = 0;
  const [classList, setClassList] = useState<string>('');
  const [realShow, setRealShow] = useState<boolean>(false);
  const action = useMemo(() => {
    return show ? 'enter' : 'leave';
  }, [show]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFrom, setIsFrom] = useState<boolean>(false);
  const [isTo, setIsTo] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [step, setStep] = useState<number>(0);
  const childRef = useRef<HTMLElement>(null);

  const startTimeout = (callback: () => void, ms: number) => {
    timeoutRef.current = setTimeout(() => {
      callback();
    }, ms);
  };

  const stopTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useDidMountEffect(() => {
    stopTimeout();
    setIsActive(false);
    setIsFrom(false);
    setIsTo(false);
    setStep(1);
  }, [show]);

  useEffect(() => {
    if (show) {
      setStep(1);
    }
  }, []);

  useEffect(() => {
    if (!step) return;
    switch (step) {
      case 1: {
        stopTimeout();
        setIsActive(true);
        setIsFrom(true);
        startTimeout(() => {
          setStep(2);
        }, 1);
        break;
      }
      case 2:
        setRealShow(true);
        startTimeout(() => {
          setStep(3);
        }, 80);
        break;
      case 3: {
        setIsFrom(false);
        setIsTo(true);
        const transitionDuration =
          window?.getComputedStyle(childRef.current as HTMLElement)
            ?.transitionDuration || '';
        const duration = convertToMilliseconds(transitionDuration);
        const transitionDelay =
          window?.getComputedStyle(childRef.current as HTMLElement)
            ?.transitionDelay || '';
        const delay = convertToMilliseconds(transitionDelay);
        startTimeout(
          () => {
            setStep(4);
          },
          (duration || DEFAULT_DURATION) + delay
        );
        break;
      }
      case 4: {
        // console.log('step - 4');
        setIsActive(false);
        setIsTo(false);
        if (!show) {
          setRealShow(false);
        }
        setStep(0);
        break;
      }
      default: {
        break;
      }
    }
  }, [action, show, step]);

  useEffect(() => {
    if (action === 'enter' && isFrom) {
      setRealShow(true);
    }
  }, [action, isFrom]);

  useEffect(() => {
    setClassList(
      `${isActive ? ` ${name}-${action}-active` : ``}${isFrom ? ` ${name}-${action}-from` : ``}${isTo ? ` ${name}-${action}-to` : ``}`
    );
  }, [action, isActive, isFrom, isTo, name]);

  return (
    <>
      {realShow &&
        Children.map(children, (child) => {
          const element = child as ReactElement;
          return cloneElement(element, {
            ref: childRef,
            className: `${element.props.className}${classList}`,
          });
        })}
    </>
  );
}

export default Transition;
